export interface Result {
  urlList: UrlList[];
}

export interface UrlList {
  url: string;
}

export interface UseUCSCFiles {
  error: string | null;
  geneModelUrls: string[] | undefined;
  isLoading: boolean;
}
