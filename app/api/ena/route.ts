import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // const { searchParams } = new URL(request.url);
  const accessions = ["GCA_009859065.2"]; // const accessions = searchParams.getAll('accessions');
  const sample_ids = []
  if (accessions.length > 0) {
    const queryParams = new URLSearchParams({
      assembly_set_accession: `"${accessions.join(',')}"`, // Add quotes manually
    });

    const fields = ["scientific_name", "sample_accession"].join(",");
    
    const accesion_check_url = `https://www.ebi.ac.uk/ena/portal/api/search?result=assembly&fields=${fields}&query=${queryParams.toString().replace(/=/g, '%3D')}&format=json&limit=10`;
    const response = await fetch(accesion_check_url);
    const result = await response.json();  // Parse the JSON response

    for (const assembly of result) {
      sample_ids.push(assembly.sample_accession);
    }
  }
  
  const filter_parameters = sample_ids.map((sample_id: String) => `sample_accession=="${sample_id}"`).join(' AND ');
  
  const runQueryParams = new URLSearchParams({
    query: filter_parameters,
  });
  const url = `https://www.ebi.ac.uk/ena/portal/api/search?result=read_run&${runQueryParams.toString().replace(/%3D%3D/g, '%3D')}&limit=1000&format=json`;
  console.log(url);
  const response = await fetch(url);
  const result = await response.json();
  return NextResponse.json(result);  // Send the API response back to the clien
}