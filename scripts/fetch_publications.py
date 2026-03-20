#!/usr/bin/env python3
"""
Fetch publications from ORCID for Dr. Charlene Ronquillo
and output Vancouver-style citations as JSON.

Uses the ORCID public API (no authentication required).
Enriches with CrossRef for full metadata and DOIs.

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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

ORCID_ID = '0000-0002-6520-1765'
ORCID_API = f'https://pub.orcid.org/v3.0/{ORCID_ID}'
OUTPUT_FILE = Path(__file__).parent.parent / 'publications.json'

HEADERS_ORCID = {
    'Accept': 'application/json',
    'User-Agent': 'HIELab-PubFetcher/2.0',
}
HEADERS_CROSSREF = {
    'User-Agent': 'HIELab-PubFetcher/2.0 (mailto:healthinformatics.equity@ubc.ca)',
}


def fetch_orcid_works():
    """Fetch all work summaries from ORCID."""
    logger.info(f'Fetching works from ORCID: {ORCID_ID}')
    resp = requests.get(f'{ORCID_API}/works', headers=HEADERS_ORCID, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    groups = data.get('group', [])
    logger.info(f'Found {len(groups)} work groups on ORCID')
    return groups


def extract_ids_from_group(group):
    """Extract DOI, title, and other identifiers from an ORCID work group."""
    summaries = group.get('work-summary', [])
    if not summaries:
        return None

    # Use the first (preferred) summary
    summary = summaries[0]

    title_obj = summary.get('title', {})
    title_val = title_obj.get('title', {}).get('value', '') if title_obj else ''

    # Extract external IDs (DOI, etc.)
    doi = None
    ext_ids = group.get('external-ids', {}).get('external-id', [])
    for eid in ext_ids:
        if eid.get('external-id-type', '').lower() == 'doi':
            doi = eid.get('external-id-value', '')
            break

    # Also check summary-level external IDs
    if not doi:
        summary_ext = summary.get('external-ids', {}).get('external-id', [])
        for eid in summary_ext:
            if eid.get('external-id-type', '').lower() == 'doi':
                doi = eid.get('external-id-value', '')
                break

    year = None
    pub_date = summary.get('publication-date', {})
    if pub_date and pub_date.get('year'):
        year_val = pub_date['year'].get('value', '')
        if year_val and year_val.isdigit():
            year = int(year_val)

    journal = summary.get('journal-title', {})
    journal_name = journal.get('value', '') if journal else ''

    put_code = summary.get('put-code')

    return {
        'title': title_val,
        'doi': doi,
        'year': year,
        'journal': journal_name,
        'put_code': put_code,
    }


def fetch_crossref_metadata(doi):
    """Fetch full metadata from CrossRef using DOI."""
    try:
        url = f'https://api.crossref.org/works/{doi}'
        resp = requests.get(url, headers=HEADERS_CROSSREF, timeout=10)
        if resp.ok:
            return resp.json().get('message', {})
    except Exception as e:
        logger.warning(f'  CrossRef lookup failed for {doi}: {e}')
    return None


def search_crossref_by_title(title):
    """Search CrossRef by title to find DOI and metadata."""
    try:
        resp = requests.get(
            'https://api.crossref.org/works',
            params={'query.bibliographic': title, 'rows': 1},
            headers=HEADERS_CROSSREF,
            timeout=10,
        )
        if resp.ok:
            items = resp.json().get('message', {}).get('items', [])
            if items:
                candidate = items[0]
                candidate_title = candidate.get('title', [''])[0].lower()
                title_lower = title.lower()
                # Verify title similarity
                if (title_lower[:40] in candidate_title or
                        candidate_title[:40] in title_lower):
                    return candidate
    except Exception as e:
        logger.warning(f'  CrossRef title search failed: {e}')
    return None


def format_authors_vancouver(authors):
    """Format CrossRef author list to Vancouver style."""
    if not authors:
        return ''

    formatted = []
    for author in authors:
        family = author.get('family', '')
        given = author.get('given', '')
        if family and given:
            initials = ''.join(p[0].upper() for p in given.split() if p)
            formatted.append(f'{family} {initials}')
        elif family:
            formatted.append(family)
        elif author.get('name'):
            formatted.append(author['name'])

    if len(formatted) > 6:
        return ', '.join(formatted[:6]) + ', et al'
    return ', '.join(formatted)


def format_vancouver_citation(meta, orcid_info):
    """Format a publication in Vancouver style using CrossRef or ORCID data."""
    # Use CrossRef metadata if available
    if meta:
        authors_list = meta.get('author', [])
        authors = format_authors_vancouver(authors_list)

        title = meta.get('title', [''])[0] if meta.get('title') else orcid_info['title']
        if not title:
            title = 'Untitled'
        if not title.endswith('.'):
            title += '.'

        container = ''
        container_titles = meta.get('container-title', [])
        if container_titles:
            container = container_titles[0]

        year = orcid_info.get('year', '')
        # Try CrossRef date if ORCID year missing
        if not year:
            date_parts = meta.get('published', {}).get('date-parts', [[]])
            if date_parts and date_parts[0]:
                year = date_parts[0][0]

        volume = meta.get('volume', '')
        issue = meta.get('issue', '')
        page = meta.get('page', '')

        citation = f'{authors}. {title}'
        if container:
            citation += f' {container}.'
        if year:
            citation += f' {year}'
        if volume:
            citation += f';{volume}'
            if issue:
                citation += f'({issue})'
        if page:
            citation += f':{page}'
        if not citation.endswith('.'):
            citation += '.'

        return citation

    # Fallback: minimal citation from ORCID data only
    title = orcid_info.get('title', 'Untitled')
    if not title.endswith('.'):
        title += '.'
    journal = orcid_info.get('journal', '')
    year = orcid_info.get('year', '')

    citation = title
    if journal:
        citation += f' {journal}.'
    if year:
        citation += f' {year}.'
    return citation


def process_publications(groups):
    """Process all ORCID work groups into publication entries."""
    results = []

    for i, group in enumerate(groups):
        orcid_info = extract_ids_from_group(group)
        if not orcid_info or not orcid_info.get('title'):
            continue

        doi = orcid_info.get('doi')
        crossref_meta = None

        # Try CrossRef by DOI first
        if doi:
            crossref_meta = fetch_crossref_metadata(doi)
            time.sleep(0.5)

        # If no DOI or CrossRef failed, search by title
        if not crossref_meta:
            crossref_meta = search_crossref_by_title(orcid_info['title'])
            if crossref_meta and not doi:
                doi = crossref_meta.get('DOI')
                if doi:
                    logger.info(f'  DOI found via title search: {doi}')
            time.sleep(0.5)

        vancouver = format_vancouver_citation(crossref_meta, orcid_info)

        url = ''
        if doi:
            url = f'https://doi.org/{doi}'

        entry = {
            'title': orcid_info['title'],
            'year': orcid_info.get('year'),
            'vancouver_citation': vancouver,
            'doi': doi,
            'url': url,
        }
        results.append(entry)
        logger.info(f'  [{i + 1}/{len(groups)}] {entry["title"][:60]}')

    return results


def main():
    try:
        groups = fetch_orcid_works()
        results = process_publications(groups)
        results.sort(key=lambda x: x.get('year') or 0, reverse=True)

        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        logger.info(f'Wrote {len(results)} publications to {OUTPUT_FILE}')

    except Exception as e:
        logger.error(f'Fatal error: {e}')
        # Preserve existing file if it exists
        if not OUTPUT_FILE.exists():
            with open(OUTPUT_FILE, 'w') as f:
                json.dump([], f)
        sys.exit(1)


if __name__ == '__main__':
    main()
