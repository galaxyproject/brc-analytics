export interface Result {
  urlList: UrlList[];
}

export interface UrlList {
  url: string;
}

export interface UseUCSCFiles {
  geneModelUrls: string[] | undefined;
}
