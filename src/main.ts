// check if jQuery is availible
if (!$ || !jQuery) console.warn("This library requires jQuery to function. Please install jQuery");

class LinkInstance {
    // data members
    private options: LinkOptions;

    // methods
    constructor(options: object) {
        // default values
        const defaultValues: LinkOptions = {
            showProgressBar: true,
            progressBarQuery: "#link-progress-bar",
            linkId: [],
            replaceHead: true
        }

        let actual = $.extend({}, defaultValues, options || {});
        // set option values
        this.options = actual;

        // create progress bar on the dom if it does not exist
        if ($(this.options.progressBarQuery).length == 0) {
            // progress bar does not exist, add default progress bar at the beginning of body
            const progressBarHtml: JQuery = $('<div id="link-progress-bar"></div>').attr("status", "waiting");
            $('body').prepend(progressBarHtml);

        }

        // attach event handler
        $(document).on("click", "a[href]", (event: JQueryEventObject) => {
            event.preventDefault();
            console.info("Navigation occured: ", $(event.target).attr('href'));
            this.loadPage(<string>$(event.target).attr('href'));
        })
    }

    /**
     * Add a new component to the link instance by id
     * @returns {void}
     */
    addLinkById(id: string): void {
        this.options.linkId.push(id);
    }

    /**
     * @returns {string[]} list of ids to be replaced on next page load
     */
    linkId(): string[] {
        return this.options.linkId;
    }

    /**
     * @returns {number} the status code of the requested page
     */
    async loadPage(url: string) {
        // remove progress bar done attribute 
        const progressBarQuery = this.options.progressBarQuery;
        $(progressBarQuery).attr("status", "waiting");

        // get page with ajax
        $.ajax({
            xhr: function () {
                let xhr = new XMLHttpRequest();
                //Download progress
                xhr.addEventListener("progress", function (evt: ProgressEvent) {
                    if (evt.lengthComputable) {
                        let percentComplete = evt.loaded / evt.total;
                        let _percent = Math.round(percentComplete);
                        // update progress bar
                        $(progressBarQuery).css('width', Math.max(_percent, 30) + "%");
                    }
                    else {
                        // progress bar is not availiable, set progress bar to half way
                    }
                });
                return xhr;
            },
            type: 'GET',
            url,
            data: {},
        }).always((data) => {
            if (typeof data != typeof "") data = data.responseText;
            let headHtml = data.match(/\<head[^>]*\>([^]*)\<\/head\>/m)[0];
            let bodyHtml = data.match(/\<body[^>]*\>([^]*)\<\/body\>/m)[0];

            // jQuery object with data from AJAX
            let jqHead = $(`<div>${headHtml}</div>`); // <div> dummy wrapper
            let jqBody = $(`<div>${bodyHtml}</div>`);

            // remove all library code from string
            jqHead.find("[link-js-library],[link-ignore]").remove();
            jqBody.find("[link-js-library],[link-ignore]").remove();

            // history api
            history.pushState(url, document.title, url);

            //isLoading = false;

            // styles
            $(progressBarQuery).css('width', '105%');

            // replace all head
            if (this.options.replaceHead) {
                // replace head element
                $("head").html(jqHead.html());
            }
            else {
                // update title
                let temp:string|undefined = jqHead.find("title").text();
                if (!temp) {
                    // find title in body
                    temp = jqBody.find("title").text();
                    if(!temp) console.warn("Title element not found on requested page. Ignoring.")
                }
                document.title = temp || url;
            }

            // set content to data
            //var html = $(data).filter('#content').html();
            //$('#content').html(html);
            //document.title = $(data).filter('title').text();

            for (let query of this.options.linkId) {
                // select query on dom
                let domElement = $(query);
                if (domElement.length == 0) {
                    console.warn(`Element matching query "${query}" not found on dom. Ignoring element.`);
                    continue;
                }
                // find html string in jqData
                let newElement = jqBody.find(query);
                if (newElement.length == 0) {
                    console.warn(`Element matching query "${query}" not found in loaded page. Ignoring element.`);
                    continue;
                }

                // insert text
                domElement.html(newElement.html());
            }

            // update scripts
            //updateScriptList(getScriptList(data));

            // trigger event functions:
            // jqDocument.trigger("pageLoad");

            // delay for animations
            setTimeout(() => { $(progressBarQuery).attr("status", "done") }, 250);
            setTimeout(() => { $(progressBarQuery).css('width', '0%'); }, 600);
        });
        return 0;
    }

}