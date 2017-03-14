var saveFile = null;
var download = document.createElement("a");
var downloadStateChanged = false;
download.setAttribute("download", "artist.txt");
var app = angular.module("myApp", []);
app.controller("mainController", function ($scope) {
    /* responses hold the current number of tracks to fill the table with, if applicable
       view controls which tab is shown on the html page
       pageIndex keeps track of which page to show on the main page
       maxResults hold the number of results found from the query */
    $scope.responses = [];
    $scope.view = 0;
    $scope.pageIndex;
    $scope.maxResults;

    $scope.getInfo = function () {
        // if input field was left empty, alert the user to fill something in
        if (!$scope.artist) {
            $("#error").text("You must enter an artist!");
            $("#error").css("color", "red");
            return;
        }
        // if there is something in the input, go ahead and try with the query search
        $("#error").text("");
        $.getJSON(`https://itunes.apple.com/search?term=${$scope.artist.replace(' ', '+')}&country=us&callback=?`, fillTable.bind(null, $scope));
    };

    $scope.moreInfo = function (index) {
        // populate the details table with the specific track clicked on, then chnge the view
        var response = $scope.responses[index];
        $("#detailsArtist").text(response.artistName);
        $("#detailsTrackName").text(response.trackName);
        $("#detailsRelease").text(response.releaseDate);
        $("#detailsCollectionName").text(response.collectionName);
        $("#detailsCollectionPrice").text("$" + response.collectionPrice);
        $("#detailsTrackPrice").text(response.trackPrice);
        $("#detailsTrackNumber").text(response.trackNumber);
        $("#detailsTrackCount").text(response.trackCount);
        $("#detailsImage").html(`<img src="${response.artworkUrl60}" alt="album artwork" class="img-responsive img-rounded">`);
        $("#detailsKind").text(response.kind);
        $("#detailsGenre").text(response.primaryGenreName);
        $scope.view = 1;
    };

    $scope.handleFiles = function (files) {
        // function to handle saving the file to user's device
        // update the download state
        downloadStateChanged = true;
        // set up a file object and a FileReader object
        var file = files[0];
        var filereader = new FileReader();
        // when the FileReader has read the file, pass the data to the fillTable function and allow the user to download the information again
        filereader.onloadend = function () {
            fillTable($scope, JSON.parse(filereader.result));
            $scope.$apply(function(){
                $scope.view = 0;
            });
            $("#download").prop("hidden", false);
            $("#download").addClass("btn btn-default");
        };
        filereader.readAsBinaryString(file);
    }

    $scope.saveToFile = function () {
        // only if a new search has been done or if a new file has been uploaded, then we assign a new file object
        if (downloadStateChanged) {
            // update the download state
            downloadStateChanged = false;
            var data = new Blob([JSON.stringify($scope.allInfo)], {type: 'text/plain'});
            // if a location has been set to saveFile, have the browser free up that memory for no leaks
            if (saveFile !== null) {
                window.URL.revokeObjectURL(savefile);
            }
            download.href = saveFile = window.URL.createObjectURL(data);
        }
        download.dispatchEvent(new MouseEvent('click'));
    };

    $scope.changeCurrentPage = function (direction) {
        // if we are at either end of the nav pages, then don't do anything
        if ((direction === "previous" && $scope.pageIndex === 1) || (direction === "next" && $scope.pageIndex === Math.ceil($scope.maxResults/10))) {
            return;
        }
        direction === "next" ? ++$scope.pageIndex : --$scope.pageIndex;
        // update the current selection of tracks to show in the table
        $scope.responses = $scope.allInfo.results.slice(($scope.pageIndex-1)*10, $scope.pageIndex*10);
        // update which page number is 'active'
        $(".active").removeClass("active");
        $(`li:nth-child(${$scope.pageIndex + 1})`).addClass("active");
    };
});


var fillTable = function ($scope, data) {
    // print out a message to the user if no results could be found
    if (data.resultCount === 0) {
        $("#error").text(`No results found for ${$scope.artist}.`);
        $("#error").css("color", "red");
        return;
    }
    // update the download state
    downloadStateChanged = true;
    /* set the first selection of tracks up to the first 10 tracks
       save the query object and the number of results found
       set the page index to 1 */
    $scope.$apply(function () {
        $scope.responses = data.results.slice(0, 10);
        $scope.allInfo = data;
        $scope.maxResults = data.resultCount;
        $scope.pageIndex = 1;
    });
    // fill in the headers for the table and allow the information to be saved 
    $("#artist").text("Artist");
    $("#release").text("Release Date");
    $("#track").text("Track Name");
    $("#download").prop("hidden", false);
    $("#download").addClass("btn btn-default");
    $("#info").text("Click on a track to see more information.");
    // add the prev arrow
    var pages = `<li>
                    <a href="#" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>`;
    // dynamically figure out how many page numbers we need in the navigation
    for (var i = 0; i < Math.ceil(data.resultCount/10); i++){
        pages += `<li><a href="#">${i+1}</a></li>`
    };
    // add the next arrow
    pages += `<li>
                <a href="#" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
                </a>
            </li>`;
    // insert the page navigation html under the table and set the active page
    $("#searchPages").html(pages);
    $("li:nth-child(2)").addClass("active");
    // add a callback function on a click to the page numbers to update the current selection of tracks show in the table and update the 'active' page
    $("li").not(':first').not(':last').click(function () {
        $scope.pageIndex = $(this).index();
        $scope.$apply(function () {
            $scope.responses = $scope.allInfo.results.slice(($scope.pageIndex-1)*10, $scope.pageIndex*10);
        });
        $(".active").removeClass("active");
        $(this).addClass("active");
    });

    // add a callback function when clicking on the prev/next arrows in the page nav to move the active page
    $("li:first").click($scope.changeCurrentPage.bind($scope, "previous"));
    $("li:last").click($scope.changeCurrentPage.bind($scope, "next"));
};