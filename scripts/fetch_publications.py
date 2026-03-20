#!/usr/bin/env python3
"""
Fetch publications from Google Scholar for Dr. Charlene Ronquillo
and output Vancouver-style citations as JSON.

Usage: python fetch_publications.py
Output: ../publications.json
"""

import json
import sys
import re
import time
import logging
from pathlib import Path

import requests
from scholarly import scholarly, ProxyGenerator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

SCHOLAR_ID = '6qKKv3EAAAAJ'
OUTPUT_FILE = Path(__file__).parent.parent / 'publications.json'


def setup_proxy():
    """Set up free proxy to avoid rate limiting."""
    try:
        pg = ProxyGenerator()
        pg.FreeProxies()
        scholarly.use_proxy(pg)
        logger.info('Proxy configured')
    except Exception as e:
        logger.warning(f'Proxy setup failed, continuing without: {e}')


def fetch_author():
    """Fetch author by Scholar ID."""
    logger.info(f'Fetching author with ID: {SCHOLAR_ID}')
    author = scholarly.search_author_id(SCHOLAR_ID)
    return scholarly.fill(author)


def format_authors_vancouver(authors_str):
    """Convert author string to Vancouver style."""
    if not authors_str:
        return ''

    # Split on ' and ' first, then commas
    if ' and ' in authors_str:
        authors = [a.strip() for a in authors_str.split(' and ')]
        expanded = []
        for a in authors:
            expanded.extend([x.strip() for x in a.split(',')])
        authors = [a for a in expanded if a]
    else:
        authors = [a.strip() for a in authors_str.split(',')]

    formatted = []
    for author in authors:
        parts = author.strip().split()
        if not parts:
            continue
        if len(parts) == 1:
            formatted.append(parts[0])
            continue

        last_name = parts[-1]
        initials = ''.join(p[0].upper() for p in parts[:-1])
        formatted.append(f'{last_name} {initials}')

    if len(formatted) > 6:
        return ', '.join(formatted[:6]) + ', et al'
    return ', '.join(formatted)


def format_vancouver_citation(pub):
    """Format a publication in Vancouver style."""
    bib = pub.get('bib', {})

    authors = format_authors_vancouver(bib.get('author', ''))
    title = bib.get('title', 'Untitled')
    if not title.endswith('.'):
        title += '.'

    journal = bib.get('journal', bib.get('venue', ''))
    year = bib.get('pub_year', '')
    volume = bib.get('volume', '')
    number = bib.get('number', '')
    pages = bib.get('pages', '')

    citation = f'{authors}. {title}'

    if journal:
        citation += f' {journal}.'

    if year:
        citation += f' {year}'

    if volume:
        citation += f';{volume}'
        if number:
            citation += f'({number})'

    if pages:
        citation += f':{pages}'

    if not citation.endswith('.'):
        citation += '.'

    return citation


def extract_doi(pub):
    """Try to extract DOI from publication data."""
    bib = pub.get('bib', {})

    for url_field in ['pub_url', 'eprint_url']:
        url = pub.get(url_field, '') or bib.get('url', '')
        if url:
            doi_match = re.search(r'(10\.\d{4,}/[^\s]+)', url)
            if doi_match:
                return doi_match.group(1).rstrip('.')

    return None


def enrich_doi_from_crossref(title):
    """Query CrossRef to find DOI by title."""
    try:
        resp = requests.get(
            'https://api.crossref.org/works',
            params={'query.bibliographic': title, 'rows': 1},
            headers={'User-Agent': 'HIELab-PubFetcher/1.0 (mailto:healthinformatics.equity@ubc.ca)'},
            timeout=10
        )
        if resp.ok:
            items = resp.json().get('message', {}).get('items', [])
            if items:
                candidate = items[0]
                # Verify title similarity
                candidate_title = candidate.get('title', [''])[0].lower()
                if title.lower()[:40] in candidate_title or candidate_title[:40] in title.lower():
                    return candidate.get('DOI')
    except Exception:
        pass
    return None


def fetch_publications():
    """Fetch and format all publications."""
    setup_proxy()
    author = fetch_author()

    publications = author.get('publications', [])
    logger.info(f'Found {len(publications)} publications')

    results = []
    for i, pub in enumerate(publications):
        try:
            filled_pub = scholarly.fill(pub)
            time.sleep(1)

            bib = filled_pub.get('bib', {})
            doi = extract_doi(filled_pub)

            # Try CrossRef if no DOI found
            if not doi and bib.get('title'):
                doi = enrich_doi_from_crossref(bib['title'])
                if doi:
                    logger.info(f'  DOI enriched via CrossRef: {doi}')

            vancouver = format_vancouver_citation(filled_pub)

            year_str = bib.get('pub_year', '')
            year = int(year_str) if year_str.isdigit() else None

            entry = {
                'title': bib.get('title', ''),
                'year': year,
                'vancouver_citation': vancouver,
                'doi': doi,
                'url': filled_pub.get('pub_url', ''),
            }
            results.append(entry)
            logger.info(f'  [{i + 1}/{len(publications)}] {entry["title"][:60]}...')

        except Exception as e:
            logger.error(f'  Error processing publication {i + 1}: {e}')
            bib = pub.get('bib', {})
            year_str = bib.get('pub_year', '')
            results.append({
                'title': bib.get('title', 'Unknown'),
                'year': int(year_str) if year_str.isdigit() else None,
                'vancouver_citation': f'{bib.get("author", "")}. {bib.get("title", "")}.',
                'doi': None,
                'url': pub.get('pub_url', ''),
            })

    return results


def main():
    try:
        results = fetch_publications()
        results.sort(key=lambda x: x.get('year') or 0, reverse=True)

        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        logger.info(f'Wrote {len(results)} publications to {OUTPUT_FILE}')

    except Exception as e:
        logger.error(f'Fatal error: {e}')
        # Preserve existing file if it exists; write empty array only if no file
        if not OUTPUT_FILE.exists():
            with open(OUTPUT_FILE, 'w') as f:
                json.dump([], f)
        sys.exit(1)


if __name__ == '__main__':
    main()
