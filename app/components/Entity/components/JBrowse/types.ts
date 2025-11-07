/**
 * JBrowse component types.
 */

/**
 * Props for the JBrowse component.
 */
export interface JBrowseProps {
  /**
   * Assembly accession identifier (e.g., GCA_000002825.3).
   */
  accession: string;
  /**
   * URL or path to the JBrowse 2 configuration file.
   * Can be a local path (e.g., /jbrowse-config/GCA_000002825.3/config.json)
   * or a remote URL (e.g., https://example.com/jbrowse/config.json).
   */
  configUrl: string;
}

/**
 * JBrowse view state interface.
 */
export interface JBrowseViewState {
  /**
   * URL to the assembly FASTA file.
   */
  assembly: {
    /**
     * Assembly name.
     */
    name: string;
    /**
     * Path to sequence adapter configuration.
     */
    sequence: {
      adapter: {
        faiLocation: {
          uri: string;
        };
        fastaLocation: {
          uri: string;
        };
        type: string;
      };
      type: string;
    };
  };
  /**
   * Default session configuration.
   */
  defaultSession?: {
    name: string;
    view: {
      id: string;
      tracks: Array<{
        configuration: string;
        displays: Array<{
          configuration: string;
          type: string;
        }>;
        type: string;
      }>;
      type: string;
    };
  };
  /**
   * Tracks configuration.
   */
  tracks: Array<{
    adapter: {
      gffLocation?: {
        uri: string;
      };
      type: string;
    };
    assemblyNames: string[];
    name: string;
    trackId: string;
    type: string;
  }>;
}
