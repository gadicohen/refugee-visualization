
$(document).ready(function() {
	var self = this;	
	var a = document.getElementById('worldSVG');
	
	a.addEventListener("load",function(){
		svgLoaded(a)
	});
	console.log(a);

	
	
});

function svgLoaded(a) {
	var svgDoc = a.contentDocument;
	this.svgDoc = svgDoc;
	$.ajax({
        type: "GET",
        url: "topCountries.csv",
        dataType: "text",
        success: function(data) {
        	renderTopCountries(svgDoc, data);
        	
        },
        error: function(e){
        	console.log(e);
        }
     });
	$.ajax({
        type: "GET",
        url: "topCountriesFrom.csv",
        dataType: "text",
        success: function(data) {
        	renderTopCountries(svgDoc, data, true);
        },
        error: function(e){
        	console.log(e);
        }
     });
}

countryAjaxCall = function(countryTitle, fromCountries,from) {
	var graph;
	if (!from) {
		graph = "graph";
	} else {
		graph = "graphFrom";
	}
	var url = graph+countryTitle.replace(/\s+/g, '').replace(/[^\w\s]|_/g, "")
	 .replace(/\s+/g, " ")+'.csv';
	$.ajax({
	        type: "GET",
	        url: url,
	        dataType: "text",
	        success: function(data) {
	        	//console.log(data);
	        	var d = CSVToArray(data);
	        	for (var j=1; j<d.length; j++) {
	        		////console.log(d[i][0]);
	        		if (d[j][0]) {
	        			var fromCountry = d[j][0];//$(svgDoc).find('[title="'+d[i][0]+'"]');
		        		if (!fromCountries[countryTitle]) {
		        			fromCountries[countryTitle] = {};
		        		}
				        fromCountries[countryTitle][fromCountry]={};
				        for (var k=1; k<d[0].length; k++) {
	        				fromCountries[countryTitle][fromCountry][k]=d[j][k];
	        			}
	        		}
	        		
	        		
	        	}
	        },
	        error: function(e){
	        	console.log(e);
	        }
	 	});
	
}

renderTopCountries = function(svgDoc,data,from) {
	var fromCountries = {};
	var toCountries = {};

	var array = CSVToArray(data)[0];
	for (var i = 0; i < array.length; i++) {
		var countryTitle = array[i];
		var country = $(svgDoc).find('[title="'+array[i]+'"]');
		if (!from) {
			country.attr('class',country.attr('class')+' refugeeTo');
			countryAjaxCall(countryTitle,fromCountries);
		} else {
			country.attr('class',country.attr('class')+' refugeeFrom');
			countryAjaxCall(countryTitle,toCountries,from);
		}
	}

	if (!from) {
		$(document).ajaxStop(function() {
			countryEvents(false, fromCountries);
			this.toCountries = toCountries;
		});
	} else {
		$(document).ajaxStop(function() {
		var a = document.getElementById('worldSVG');

		$('#selectMenu').change(function(){
			$(a.contentDocument).find('svg').attr('class',$(this)[0].value);
			countryEvents(true, toCountries);
		});
		});
	}
	
	
}

function countryEvents(from, dictOfCountries) {
		var refClass;
		var secondaryRefClass;
		var ex;
		var topClass;
		var svgDoc = this.svgDoc;
		if (from) {
			refClass = '.refugeeFrom';
			//dictOfCountries = toCountries;
			secondaryRefClass = 'to';
			ex = ["Refugees from ", " are in "];
			topClass = ".comingFrom";
		} else {
			refClass = '.refugeeTo';
			//dictOfCountries = fromCountries;
			secondaryRefClass = 'from';
			ex = ["Refugees to ", " are from "];
			topClass = ".goingTo";
		}
		
		$(svgDoc).find(topClass+' '+refClass).hover(function(){
			var title = $(this).attr('title');
			$(this).attr('class',$(this).attr('class')+' hover');
			$('#info .text').text(title);
			for (var i=0; i<Object.keys(dictOfCountries[title]).length; i++) {
				var c = $(svgDoc).find('[title="'+Object.keys(dictOfCountries[title])[i]+'"]');
				c.attr('class',c.attr('class')+' '+secondaryRefClass);
				console.log(dictOfCountries[title]);
			}
			var explanation = ex[0] + title + ex[1] + Object.keys(dictOfCountries[title]).join(", ");
			$('#info .explan').text(explanation);
		}, function() {
			var title = $(this).attr('title');
			$(this).attr('class',$(this).attr('class').replace('hover',''));
			for (var i=0; i<Object.keys(dictOfCountries[title]).length; i++) {
				var c = $(svgDoc).find('[title="'+Object.keys(dictOfCountries[title])[i]+'"]');
				if (c.length>0) {
					c.attr('class',c.attr('class').replace(secondaryRefClass,''));
				}
			}
			$('#info .explan').text('');
			$('#info .text').text('');
		});
		
		$(svgDoc).find(topClass+' '+refClass).click(function() {
			var fromText='';
			if (from) {
				fromText='From';
			}
			var url = 'graph'+fromText+$(this).attr('title').replace(/\s+/g, '').replace(/[^\w\s]|_/g, "")+'.csv';
			var expl=$('#info .explan');
			$.ajax({
		        type: "GET",
		        url: url,
		        dataType: "text",
		        success: function(data) {
		        	//console.log(data);
		        				expl.html('</br>');

		        	var d = CSVToArray(data);
		        	console.log(d.length);
		        	for (var j=1; j<d.length; j++) {
		        		console.log(d[j]);
		        		if (d[j][0]) {
		        			expl.append(d[j][0] + ': ' + d[j][d[j].length-1] + 'refugees' + '</br>');
		        		}
		        	}
		        },
		        error: function(e){
		        	console.log(e);
		        }
	     	});
		});



		// if(!from) {		
		// 	$(svgDoc).find('.refugeeTo').hover(function() {
		// 		var title = $(this).attr('title');
		// 		$(this).attr('class','refugeeTo hover');
		// 		$('#info .text').text(title);
		// 		for (var i=0; i<fromCountries[title].length; i++) {
		// 			var c = $(svgDoc).find('[title="'+fromCountries[title][i]+'"]');
		// 			c.attr('class',c.attr('class')+' from');
		// 		}
		// 		var ex = 'Refugees in '+ title + ' are from '+fromCountries[title].join(", ");
		// 		$('#info .explan').text(ex);

		// 	}, function() {
		// 		var title = $(this).attr('title');
		// 		$(this).attr('class','refugeeTo');
		// 		$('#info .text').text('');
		// 		for (var i=0; i<fromCountries[title].length; i++) {
		// 			if (isCountryTopTo[fromCountries[title][i]]) {
		// 				var c = $(svgDoc).find('[title="'+fromCountries[title][i]+'"]');
		// 				c.attr('class',' refugeeTo');
		// 			} else {
		// 				var c = $(svgDoc).find('[title="'+fromCountries[title][i]+'"]');
		// 				c.attr('class',' land';
		// 			}
		// 		}
		// 		$('#info .explan').text('');
		// 	});
		// } else {
		// 	$(svgDoc).find('.refugeeFrom').hover(function() {
		// 		var title = $(this).attr('title');
		// 		$(this).attr('class','refugeeFrom hover');
		// 		$('#info .text').text(title);
		// 		for (var i=0; i<toCountries[title].length; i++) {
		// 			$(svgDoc).find('[title="'+toCountries[title][i]+'"]').attr('class','land from');
		// 		}
		// 		var ex = 'Refugees in '+ title + ' are from '+toCountries[title].join(", ");
		// 		$('#info .explan').text(ex);

		// 	}, function() {
		// 		var title = $(this).attr('title');
		// 		$(this).attr('class','refugeeTo');
		// 		$('#info .text').text('');
		// 		for (var i=0; i<toCountries[title].length; i++) {
		// 			if (isCountryTopTo[toCountries[title][i]]) {
		// 				var c = $(svgDoc).find('[title="'+toCountries[title][i]+'"]');
		// 				c.attr('class',c.attr('class')-'hover'+' refugeeFrom');
		// 			} else {
		// 				var c = $(svgDoc).find('[title="'+toCountries[title][i]+'"]');
		// 				c.attr('class',c.attr('class')-'hover'+' refugeeFrom');
		// 			}
		// 		}
		// 		$('#info .explan').text('');
		// 	});
		// }
	
}


 function CSVToArray( strData, strDelimiter ){
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;


        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
                ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];

            }


            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }

        // Return the parsed data.
        return( arrData );
    }