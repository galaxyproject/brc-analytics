import { NextResponse } from 'next/server';

const items_limit = 100;



export async function GET(request: Request) {
  
  const fields = ['accession', 'sra_md5', 'base_count', 'study_accession', 'instrument_platform', 'instrument_model', 'library_layout'];  // ['all'];
  // const { searchParams } = new URL(request.url);
  const accessions = ["GCA_009859065.2"]; // const accessions = searchParams.getAll('accessions');
  const sample_ids = []

  await new Promise(resolve => setTimeout(resolve, 5000));
  // Check if there are any accession IDs provided
  if (accessions.length > 0) {
    console.debug(`The accessions are ${accessions}`);
    
    // Create query parameters for the API request using the accession IDs
    const queryParams = new URLSearchParams({
      assembly_set_accession: `"${accessions.join(',')}"`, 
    });
   
    // Construct the URL for the API request to fetch sample IDs based on accession IDs
    const accesion_check_url = `https://www.ebi.ac.uk/ena/portal/api/search?result=assembly&fields=sample_accession&query=${queryParams.toString().replace(/=/g, '%3D')}&format=json`;
    console.debug(`Fetching sample id: ${accesion_check_url}`);
    
    // Fetch the data from the API
    const response = await fetch(accesion_check_url);
    const result = await response.json();  // Parse the JSON response

    // Extract sample IDs from the API response and add them to the sample_ids array
    for (const assembly of result) {
      console.log(`Sample accession: ${assembly}`);
      sample_ids.push(assembly.sample_accession);
    }
    if (sample_ids.length === 0) {
      console.debug('No sample IDs found.');
      return NextResponse.json({ 'count': 0 });
    }
  }
  
  
  const filter_parameters = sample_ids.map((sample_id: String) => `sample_accession=="${sample_id}"`).join(' AND ');
  const runQueryParams = new URLSearchParams({
    query: filter_parameters,
  });
  const filter_url = `${runQueryParams.toString().replace(/%3D%3D/g, '%3D')}`;
  const count_url = `https://www.ebi.ac.uk/ena/portal/api/count?result=read_run&${filter_url}&format=json`;
  console.debug(`Count URL: ${count_url}`);
  var response = await fetch(count_url);
  var result = await response.json();
  if (result.count > items_limit) {
    console.debug(`The number of items is ${result.count}, which is more than the limit of ${items_limit}.`);
    return NextResponse.json(result)
  } 
  
  const url_search = `https://www.ebi.ac.uk/ena/portal/api/search?result=read_run&${filter_url}&fields=${fields.join(',')}&limit=1000&format=json`;
  console.debug(`Item url: ${url_search}`);
  response = await fetch(url_search);
  result = await response.json();
  
  return NextResponse.json(result);  // Send the API response back to the clien
}