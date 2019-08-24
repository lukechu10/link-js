interface LinkOptions {
    showProgressBar: boolean;
    progressBarQuery: string;

    /**
     * If true, the html will not be rendered until all the stylesheets have loaded. This prevents a flash when loading pages that cause html to be rendered without css.
     */
    waitForCss: boolean;
    
    linkId: string[];
    // replace head part of page?
    replaceHead: boolean;
}