# BRC Analytics GenKit Backend

This directory contains a GenKit backend for the BRC Analytics web application. The backend provides a chat interface and tools to access data from the BRC Analytics catalog.

## Features

- Chat interface for interacting with BRC Analytics data
- Tools for accessing organisms, assemblies, workflows, and outbreaks data
- Galaxy MCP integration for interacting with Galaxy bioinformatics platform
- RESTful API for integration with the React frontend

## Setup

1. Install dependencies:

```bash
cd genkit
npm install
```

2. Configure environment variables:

Copy the example environment file and modify as needed:

```bash
cp .env.example .env
```

Edit the `.env` file to configure:

- Model provider (Google AI, OpenAI, Anthropic, Ollama)
- API keys
- Server port and host
- Path to catalog output files
- Galaxy MCP configuration (path and credentials)

## Development

Start the development server:

```bash
npm run dev
```

This will start the GenKit server at http://localhost:3100 (or the port specified in your .env file).

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/chat` - Chat endpoint
  - Request body: `{ "message": "your message", "session_id": "optional_session_id" }`
  - Response: `{ "response": "assistant response" }`

## Available Tools

The GenKit backend provides the following tools for accessing BRC Analytics data:

### BRC Analytics Catalog Tools

- `get_organisms` - Get a list of all organisms
- `get_organism_details` - Get detailed information about a specific organism
- `get_assemblies` - Get a list of all assemblies
- `get_assembly_details` - Get detailed information about a specific assembly
- `get_workflows` - Get a list of all workflows
- `get_workflow_details` - Get detailed information about a specific workflow
- `get_outbreaks` - Get a list of all outbreaks
- `get_outbreak_details` - Get detailed information about a specific outbreak

### Galaxy MCP Integration Tools

- `getGalaxyServerInfo` - Get information about the connected Galaxy server
- `getIwcWorkflows` - Get a list of workflows from the Interoperable Workflow Catalog (IWC)
- `searchIwcWorkflows` - Search for workflows in the IWC by query string
- `importWorkflowFromIwc` - Import a workflow from IWC into Galaxy
- `getGalaxyHistories` - Get a list of histories from the Galaxy server
- `getHistoryDetails` - Get detailed information about a specific Galaxy history, including datasets
- `searchGalaxyTools` - Search for tools in the Galaxy server by name
- `createGalaxyHistory` - Create a new history in the Galaxy server

### NCBI Datasets API Tools

#### Genome Tools

- `getGenomeAnnotationReport` - Get genome annotation report for a specific genome assembly accession
- `getGenomeDatasetReport` - Get genome dataset report for specific genome assembly accessions
- `getGenomeSequenceReports` - Get genome sequence reports for a specific genome assembly accession
- `getGenomeByAssemblyNameDatasetReport` - Get genome dataset report for specific assembly names
- `getGenomeByBioprojectDatasetReport` - Get genome dataset report for specific BioProject IDs
- `getGenomeByBiosampleDatasetReport` - Get genome dataset report for specific BioSample IDs
- `getGenomeByTaxonDatasetReport` - Get genome dataset report for specific taxonomy IDs

#### Gene Tools

- `getGeneByAccession` - Get gene data for specific gene accessions
- `getGeneOrthologs` - Get gene orthologs for a specific gene ID
- `getGeneById` - Get gene data for specific gene IDs
- `getGeneLinks` - Get gene links for specific gene IDs
- `getGeneByTaxon` - Get gene data for a specific taxonomy ID
- `getGeneChromosomeSummary` - Get gene chromosome summary for a specific taxonomy ID and annotation name

#### Taxonomy Tools

- `getTaxonomyDatasetReport` - Get taxonomy dataset report for specific taxonomy IDs
- `getTaxonomyNameReport` - Get taxonomy name report for specific taxonomy IDs

#### Other Tools

- `getBiosampleReport` - Get BioSample report for specific BioSample accessions
- `getOrganelleDatasetReport` - Get organelle dataset report for specific organelle accessions

## Building for Production

Build the TypeScript code:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Integration with React Frontend

The GenKit backend can be integrated with the React frontend by making API calls to the chat endpoint. Example:

```javascript
// Example React code
async function sendChatMessage(message, sessionId) {
  const response = await fetch("http://localhost:3100/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
  });

  const data = await response.json();
  return data.response;
}
```
