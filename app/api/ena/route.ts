import { NextResponse } from 'next/server';

const items_limit = 100;



export async function POST(request: Request) {

  let { filter } = await request.json();
  const fields = ['accession', 'sra_md5', 'base_count', 'study_accession', 'instrument_platform', 'instrument_model', 'library_layout'];  // ['all'];
  const accessions = [];
  const accessionsDict: { [key: string]: string } = {};
  if (filter.includes('accession=')) {
    const accessionRegex = /(accession\s*!?=\s*)(GC[FA]_[0-9]+\.[0-9]+)/g;     
    let match;
    while ((match = accessionRegex.exec(filter)) !== null) {
      accessions.push(match[2]);
      accessionsDict[match[2]] = `${match[1]}${match[2]}`;
    }
  }
  
  const sample_ids: { [key: string]: string[] } = {}

  // Check if there are any accession IDs provided
  if (accessions.length > 0) {
    // Create query parameters for the API request using the accession IDs
    const queryParams = new URLSearchParams({
      query: `${accessions.map((item) => `assembly_set_accession="${item}"`).join(' OR ')}`, 
    });
    // Construct the URL for the API request to fetch sample IDs based on accession IDs   
    const accesion_check_url = `https://www.ebi.ac.uk/ena/portal/api/search?result=assembly&fields=assembly_set_accession,sample_accession&${queryParams.toString()}&format=json`;
    
    // Fetch the data from the API
    const response = await fetch(accesion_check_url);
    const result = await response.json();  // Parse the JSON response

    // Extract sample IDs from the API response and add them to the sample_ids array
    for (const assembly of result) {
      if (!sample_ids[assembly.assembly_set_accession]) {
        sample_ids[assembly.assembly_set_accession] = [assembly.sample_accession];
      } else {
        sample_ids[assembly.assembly_set_accession].push(assembly.sample_accession);
      }
    }
    for (const accession of accessions) {
      if (sample_ids[accession]){
        filter = filter.replace(accessionsDict[accession],  "(" + sample_ids[accession].map(sample_id => `sample_accession="${sample_id}"`).join(' OR ') + ")");
      } else {
        filter = filter.replace(accessionsDict[accession],  `sample_accession="NO_SAMPLE"`);
      }
    }
    
  }
  
  // const filter_parameters = sample_ids.map((sample_id: String) => `sample_accession=="${sample_id}"`).join(' AND ');
  const runQueryParams = new URLSearchParams({
    query: filter,
  });
  const filter_url = `${runQueryParams.toString().replace(/%3D%3D/g, '%3D')}`;
  const count_url = `https://www.ebi.ac.uk/ena/portal/api/count?result=read_run&${filter_url}&format=json`;
  // console.debug(`Count URL: ${count_url}`);
  var response = await fetch(count_url);
    if (response.status !== 200) {
    const errorMessageText = await response.text();
    let errorMessage;
    try {
      errorMessage = JSON.parse(errorMessageText).message;
    } catch (e) {
      errorMessage = errorMessageText;
    }
    return NextResponse.json({'error':  `from ENA, ${errorMessage}`, 'count': 0});
  }
  var result = await response.json();
  var count = parseInt(result.count);
  if (count === 0) {
    return NextResponse.json(result);
  }
  if (count > items_limit) {
    return NextResponse.json({'error': `To many entries return: ${count}, please add filters to reduce the number of entries.`});
  } 
  const url_search = `https://www.ebi.ac.uk/ena/portal/api/search?result=read_run&${filter_url}&fields=${fields.join(',')}&limit=1000&format=json`;
  response = await fetch(url_search);
  result = await response.json();
  return NextResponse.json({ count: count, data: result }); 
}