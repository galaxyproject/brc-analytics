"""BioNym's claims about a gene, and the graph itself, read from the gene's
BioNym graph.

A BioNym graph is BioNym's JSON output for one gene: nodes, edges between
them, and metadata about the run. Each claim is a Claim node that a
Publication or Dataset node `reports`; the edge holds BioNym's confidence in
the claim, and its one piece of evidence holds the quote the claim rests on.
The graph view keeps every node and edge, but only the fields the gene
page's graph explorer draws.

The graphs are checked in, gzipped and named by gene UID, under
app/data/bionym (see its README) until they are published to the gene data
store. A graph that isn't shaped as described raises rather than being
partly shown. Only the fields read here are declared on the graph models;
BioNym's others are ignored.
"""

import gzip
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Dict, List, Literal, Optional
from urllib.parse import urlsplit
from uuid import UUID

from pydantic import BaseModel

from app.models.genes import (
    BionymClaim,
    BionymClaims,
    BionymGraph,
    BionymGraphEdge,
    BionymGraphNode,
    BionymSource,
)

BIONYM_GRAPHS_DIR = Path(__file__).resolve().parent.parent / "data" / "bionym"

# The node types that report claims, and the kind of source each is.
_SOURCE_KINDS: Dict[str, Literal["paper", "dataset"]] = {
    "Publication": "paper",
    "Dataset": "dataset",
}


class _Node(BaseModel):
    type: str
    label: str
    url: Optional[str]


class _Evidence(BaseModel):
    retrieved_at: datetime
    payload: Dict[str, object]


class _Edge(BaseModel):
    subject: str
    predicate: str
    object: str
    confidence: float
    evidence: List[_Evidence]


class _Metadata(BaseModel):
    input: str
    query: str


class _Graph(BaseModel):
    nodes: Dict[str, _Node]
    edges: List[_Edge]
    metadata: _Metadata


def _https_url(url: Optional[str]) -> Optional[str]:
    """The URL if it is an https: link, else None."""
    if url is None:
        return None
    parts = urlsplit(url)
    return url if parts.scheme == "https" and parts.netloc else None


def _run_date(graph: _Graph) -> date:
    """The latest retrieved_at among the graph's evidence, as a UTC date."""
    times = [ev.retrieved_at for edge in graph.edges for ev in edge.evidence]
    if not times:
        raise ValueError("the graph has no evidence to date it by")
    return max(times).astimezone(timezone.utc).date()


def _claim(graph: _Graph, edge: _Edge) -> BionymClaim:
    claim_node = graph.nodes.get(edge.object)
    if claim_node is None or claim_node.type != "Claim":
        raise ValueError(f"{edge.subject} reports {edge.object}, which isn't a claim")
    if len(edge.evidence) != 1:
        raise ValueError(
            f"the claim {edge.object!r} from {edge.subject} has "
            f"{len(edge.evidence)} pieces of evidence, not 1"
        )
    quote = edge.evidence[0].payload.get("quote")
    if not isinstance(quote, str) or not quote:
        raise ValueError(f"the claim {edge.object!r} from {edge.subject} has no quote")
    return BionymClaim(text=claim_node.label, quote=quote, confidence=edge.confidence)


def build_claims(gene_uid: UUID, graph: _Graph) -> BionymClaims:
    """The graph's claims grouped by source: sources by title, and claims by
    confidence, highest first. The gene page keeps these orders, re-sorting
    sources only by how many claims it shows."""
    sources: Dict[str, BionymSource] = {}
    for edge in graph.edges:
        if edge.predicate != "reports":
            continue
        node = graph.nodes.get(edge.subject)
        kind = _SOURCE_KINDS.get(node.type) if node else None
        if node is None or kind is None:
            raise ValueError(f"{edge.subject} reports a claim but isn't a source")
        source = sources.get(edge.subject)
        if source is None:
            source = sources[edge.subject] = BionymSource(
                id=edge.subject,
                kind=kind,
                title=node.label,
                url=_https_url(node.url),
                claims=[],
            )
        source.claims.append(_claim(graph, edge))
    for source in sources.values():
        source.claims.sort(key=lambda c: (-c.confidence, c.text))
    return BionymClaims(
        gene_uid=gene_uid,
        input=graph.metadata.input,
        run_date=_run_date(graph),
        sources=sorted(sources.values(), key=lambda s: (s.title.casefold(), s.id)),
    )


def build_graph(gene_uid: UUID, graph: _Graph) -> BionymGraph:
    """Every node and edge in the graph, in BioNym's order, with only the
    fields the graph explorer draws and only https: links."""
    if graph.metadata.query not in graph.nodes:
        raise ValueError(f"the graph's query {graph.metadata.query!r} isn't a node")
    for edge in graph.edges:
        for end in (edge.subject, edge.object):
            if end not in graph.nodes:
                raise ValueError(
                    f"an edge {edge.predicate!r} ends at {end!r}, not a node"
                )
    return BionymGraph(
        gene_uid=gene_uid,
        query=graph.metadata.query,
        nodes=[
            BionymGraphNode(
                id=node_id, type=node.type, label=node.label, url=_https_url(node.url)
            )
            for node_id, node in graph.nodes.items()
        ],
        edges=[
            BionymGraphEdge(
                subject=edge.subject,
                predicate=edge.predicate,
                object=edge.object,
                confidence=edge.confidence,
            )
            for edge in graph.edges
        ],
    )


class BionymGraphStore:
    """The BioNym graphs in a directory, each named <gene_uid>.json.gz.

    Every graph's claims and graph view are built when the store is made: on
    the first BioNym request, and in the tests over every checked-in graph, so
    a graph of the wrong shape fails the tests rather than reaching a gene's
    page.
    """

    def __init__(self, directory: Path):
        self._claims: Dict[UUID, BionymClaims] = {}
        self._graphs: Dict[UUID, BionymGraph] = {}
        for path in directory.glob("*.json.gz"):
            gene_uid = UUID(path.name.removesuffix(".json.gz"))
            with gzip.open(path, "rb") as f:
                graph = _Graph.model_validate_json(f.read())
            self._claims[gene_uid] = build_claims(gene_uid, graph)
            self._graphs[gene_uid] = build_graph(gene_uid, graph)

    def get_claims(self, gene_uid: UUID) -> Optional[BionymClaims]:
        """The gene's claims, or None if it has no graph."""
        return self._claims.get(gene_uid)

    def get_graph(self, gene_uid: UUID) -> Optional[BionymGraph]:
        """The gene's graph view, or None if it has no graph."""
        return self._graphs.get(gene_uid)
