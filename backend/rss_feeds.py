import re
import xml.etree.ElementTree as ET
from html import escape

import requests

FEEDS = [
    {
        "id": "el-nacional",
        "name": "El Nacional",
        "url": "https://elnacional.com.do/feed/",
        "provincia": "Distrito Nacional",
    },
    {
        "id": "diario-libre",
        "name": "Diario Libre",
        "url": "https://www.diariolibre.com/rss.xml",
        "provincia": "Distrito Nacional",
    },
    {
        "id": "al-momento",
        "name": "Al Momento",
        "url": "https://almomento.net/feed/",
        "provincia": "Distrito Nacional",
    },
    {
        "id": "listin-diario",
        "name": "Listín Diario",
        "url": "https://listindiario.com/rss/noticias",
        "provincia": "Distrito Nacional",
    },
    {
        "id": "el-dia",
        "name": "El Día",
        "url": "https://eldia.com.do/feed/",
        "provincia": "Distrito Nacional",
    },
]

UA = {"User-Agent": "BCNewsEntTV/1.0 (+https://bcnews.ent.tv)"}


def _strip_html(text):
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"&nbsp;", " ", clean)
    clean = re.sub(r"&amp;", "&", clean)
    clean = re.sub(r"&lt;", "<", clean)
    clean = re.sub(r"&gt;", ">", clean)
    clean = re.sub(r"&quot;", '"', clean)
    clean = re.sub(r"&#39;", "'", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def _first(el, *tags):
    for tag in tags:
        node = el.find(tag)
        if node is not None and node.text:
            return node.text.strip()
    return ""


def parse_feed(feed_meta, timeout=15):
    try:
        r = requests.get(feed_meta["url"], headers=UA, timeout=timeout)
        r.raise_for_status()
        root = ET.fromstring(r.content)
    except Exception as e:
        return {"feed": feed_meta["id"], "error": str(e)[:200], "items": []}

    items = []
    for item in root.iter("item"):
        title = _strip_html(_first(item, "title"))
        link = _first(item, "link")
        summary = _strip_html(_first(item, "description", "content:encoded"))
        pub = _first(item, "pubDate")
        if title and link:
            items.append(
                {
                    "titulo": title[:255],
                    "resumen": summary[:600],
                    "enlace_original": link,
                    "fecha": pub,
                    "fuente": feed_meta["name"],
                    "fuente_id": feed_meta["id"],
                    "provincia": feed_meta["provincia"],
                }
            )
        if len(items) >= 15:
            break
    return {"feed": feed_meta["id"], "name": feed_meta["name"], "items": items}


def fetch_all_feeds():
    results = []
    for feed in FEEDS:
        results.append(parse_feed(feed))
    return results


def merge_feeds(results, limit=40):
    merged = []
    for res in results:
        merged.extend(res.get("items", []))
    merged.sort(key=lambda x: x.get("fecha") or "", reverse=True)
    return merged[:limit]
