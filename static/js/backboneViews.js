// console.log(L)
    (function($){
        var MapView = Backbone.View.extend({
        // el: $('#map'),
        events: {
            'change select#featureInputType' : 'loadGeoJSON'
        },

        // template: _.template($('#map-template').html()),
        render: function() {
            // console.log("make map");
            window.map = L.map('map').setView([51.686068, 5.198107], 7);

            window.map.scrollWheelZoom.disable();
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
                maxZoom: 18,
                minZoom: 4,
                id: 'mapbox.satellite',
                attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a>"
            }).addTo(window.map);

        },
        loadGeoJSON: function(layerInput){ 
            // console.log('Delete existing layers')
            window.map.eachLayer(function (layer) {
                if (layer.options.id == undefined){
                    window.map.removeLayer(layer);
                }  
            }); 

            if (layerInput == undefined){
                return
            }

            $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                url: "/getGeoJSON",
                data: JSON.stringify({category: layerInput}),
                success: function (data) {
                    window.geojson = L.geoJson(data, {
                        style: MapView.style(),
                        onEachFeature: MapView.onEachFeature
                    }).addTo(window.map);

                },
                error: function(e,f){
                    console.log("error ");
                    console.log(e);
                    console.log(f);
                },
                dataType: "json"
            });


            // console.log("add "+layerInput+" layer")
            if (layerInput == 'Municipality'){
                $("#featureInput").attr('placeholder', "Delft, Rotterdam");
            } else if (layerInput == 'Province'){
                $("#featureInput").attr('placeholder', "Zuid-Holland, Utrecht");
            // } else if (layerInput == 'Landcover'){
            //     window.geojson = L.geoJson(corine, {
            //         style: MapView.style(),
            //         onEachFeature: MapView.onEachFeature
            //     }).addTo(window.map);
            //     $("#featureInput").attr('placeholder', "Zuid-Holland, Utrecht");
            } else if (layerInput == 'Raster 10km2'){
                $("#featureInput").attr('placeholder', "10kmE388N310, 10kmE394N315");
            } else if (layerInput == 'Raster 100km2'){
                $("#featureInput").attr('placeholder', "100kmE39N31, 100kmE40N31");
            } else {
                $("#featureInput").attr('placeholder', "Delft, Rotterdam");
                // console.log(window.geojson);
            }

        }, 
        style: function(){
            return {
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7,
                fillColor: '#FFEDA0'
            }
        }, 
        onEachFeature: function(feature, featureLayer) {
            featureLayer.on({
                // mouseover: MapView.highlightFeature,
                // mouseout: resetHighlight,
                // click: zoomToFeature
                click: MapView.highlightToggle
            });
        },
        highlightToggle: function(e){
            if ($("#featureInput").attr("disabled") == 'disabled'){
                return
            };
            if (e.target.feature.highlighted == undefined){
                e.target.feature.highlighted = true;
                // console.log("undefined");
                MapView.highlightFeature(e);
            } else if (e.target.feature.highlighted == true){
                e.target.feature.highlighted = false;
                // console.log("already highlighted");
                MapView.resetHighlight(e);
            } else {
                e.target.feature.highlighted = true;
                // console.log("not yet highlighted");
                MapView.highlightFeature(e);
            };   
        },
        highlightFeature: function(e) {
            layer = e.target;

            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0
            });
            if (!L.Browser.ie && !L.Browser.opera) {
                layer.bringToFront();
            }

            names = $("#featureInput").val()
            newName = e.target.feature.properties.NAME
            if (newName.length == 0 || $("#featureInput").attr("disabled") == 'disabled'){
                return
            }
            
            namesArray = names.split(',')

            if (namesArray[0].length > 0){
                newName = " "+e.target.feature.properties.NAME
                namesArray.push(newName)
                outputNames = namesArray.join()
            } else {
                namesArray = [newName]
                outputNames = namesArray.join()
            }
            // console.log(outputNames)
            
            $("#featureInput").val(outputNames)
        },
        resetHighlight: function(e) {
            geojson.resetStyle(e.target);
            // info.update();
            names = $("#featureInput").val()
            newName = e.target.feature.properties.NAME
            namesArray = names.split(',')
            namesArray.remove(newName)
            namesArray.remove(" "+newName)
            outputNames = namesArray.join()
            $("#featureInput").val(outputNames)
        }

    });

    var MapView = new MapView();

    window.ListView = Backbone.View.extend({
        el: $('body'),
        events: {
          'change select#menu' : 'goTo',
          'click button.goHome' : 'goHome',
          'click button.submitForm1' : 'form1',
          'change select#featureInputType' : 'getGeoJSON',
          // 'click button.getForm' : 'getForm1',
          'click button.getForm' : 'cleanup',
          'click button.getGraph' : 'getGraph',
          'click button.removeMarker' : 'removeMarker'
        },
        form1Template: _.template($('#form1Template').html()),
        form2Template: _.template($('#form2Template').html()),

        initialize: function() {
            
            // console.log("start app");

            this.getForm1()

            MapView.render();

            if (screen.width > 1000){
                $('#menuContainer').css('visibility','visible');
                $('.goHome').css('visibility','visible');
                // map.scrollWheelZoom.enable();

            }
           
            MapView.loadGeoJSON('Municipality');
            _.bindAll(this, 'getForm2');

            // Create function to remove item from array by value
            Array.prototype.remove = function() {
                var what, a = arguments, L = a.length, ax;
                while (L && this.length) {
                    what = a[--L];
                    while ((ax = this.indexOf(what)) !== -1) {
                        this.splice(ax, 1);
                    }
                }
                return this;
            };

        },
        
        goTo: function(){
            this.input = this.$('#menu');
            $.scrollTo(this.input.val(), { duration:800 });
        },
        goHome: function(){
            $.scrollTo('#page_1', { duration:800 });
            $('#menu').val('#page_1');
        },
        form1: function(){
            var features = $('#featureInput').val().split("");
            for (i=0;i<features.length;i++){
                if (features[i] == " "){
                    // console.log("Space")
                    delete features[i];
                }
            }
            features = features.join("")
            console.log( features );
            var featureCategory = $('#featureInputType').val();
            if (featureCategory.indexOf("Raster") > -1){
                featureCategory = "raster"
            }
            console.log(featureCategory);
            var obsProperty = "http://dbpedia.org/resource/"+$('#obsProperty').val();
            console.log(obsProperty);

            problems = []

            if (features.length == 0){
                $('#featureInput').css('border','2px solid red');
                problems.push("features");
            }
            // if ($('#tempGranValue').val().length == 0){
            //     $('#tempGranValue').css('border','2px solid red');
            //     problems.push("temporal granularity value");
            // }
            // console.log(problems);
            if (problems.length > 0){
                errorText = '<h5>Please select '+problems.join(' & ')+'</h5>';
                $('#error').html(errorText);
            } else {
                console.log("send data");
                $('#error').html('');
                $('.getGraph').html('Calculating...');
                $('button.getGraph').prop('disabled', true);
                $('#featureInput').attr("disabled", "disabled");
                $('#featureInputType').attr("disabled", "disabled"); 
                $('#obsProperty').attr("disabled", "disabled"); 
                // $('#tempGranValue').attr("disabled", "disabled"); 
                // $('#tempGranUnit').attr("disabled", "disabled"); 
                // $('#slider').dateRangeSlider("disable");
                // alert("Still under construction.. Sorry!");
                input = JSON.stringify({
                    feature: features, 
                    featureType: featureCategory, 
                    // tempRange: startTime+","+endTime
                })

                $.ajax({
                  type: "POST",
                  context: this,
                  contentType: "application/json; charset=utf-8",
                  url: "/getSensors",
                  data: input,
                  success: this.foundSensors,
                  error: this.errorLog,
                  dataType: "json"
                });

                
            }



            
        },
        getGeoJSON: function(){
            this.input = this.$('#featureInputType');

            $("#featureInput").val('');
            // console.log($("#featureInput"));

            MapView.loadGeoJSON(this.input.val());


        },
        getForm1: function(){
            $("#vis").html(this.form1Template);

            // $("#slider").dateRangeSlider();

        },
        getForm2: function(){
                $("#vis").html(this.form2Template);

                $("#slider").dateRangeSlider();

        },
        cleanup: function(){
            MapView.loadGeoJSON('Municipality');
            this.getForm1();

        },
        foundSensors: function (data) {
            data = JSON.parse(data.sensors)
            console.log(data.type);
           
            function onEachFeature(feature, layer) {
                var popupContent = "<div class='row' id='popup'><table style='width:100%'><tr><td>URI</td><td><a href='"+feature.properties.sensorUri+"' target=_blank>" + feature.properties.sensorUri +"</td></tr><tr><td>Observed property</td><td><a href='" + feature.properties.observedProperty[1]  +"' target=_blank>"+feature.properties.observedProperty[1]+"</td></tr><tr><td>SOS</td><td>" + feature.properties.sos +"</td></tr></table><button class='button-primary removeMarker'>Remove</button></div>";

                layer.bindPopup(popupContent);
            };

            window.geojsonSensors = L.geoJson(data,{
                onEachFeature: onEachFeature,
                pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                    });
                }
            }).addTo(window.map);
            map.fitBounds(window.geojsonSensors.getBounds());
            
            this.getForm2();
                
        },
        errorLog: function(e,f){
            console.log("error ");
            console.log(e);
            console.log(f);
        },

        getGraph: function(){
            var temporalGranularity = $('#tempGranValue').val() +" "+ $('#tempGranUnit').val();
            console.log(temporalGranularity);
            var tempAggType = $('#temporalAggType').val();
            console.log("temporal aggregation: "+tempAggType);
            var spatialAggType = $('#spatialAggType').val();
            console.log("spatial aggregation: "+spatialAggType);
            var startTime = new Date($('#slider').dateRangeSlider("values").min.setUTCHours(0)).toISOString();
            console.log(startTime);
            var endTime = new Date($('#slider').dateRangeSlider("values").max.setUTCHours(0)).toISOString();
            console.log(endTime);

            MapView.loadGeoJSON(undefined);

            $('#tempGranValue').attr("disabled", "disabled"); 
            $('#tempGranUnit').attr("disabled", "disabled");
            $('#spatialAggType').attr("disabled", "disabled"); 
            $('#temporalAggType').attr("disabled", "disabled"); 
 
            $('#slider').dateRangeSlider("disable");

            var input = JSON.stringify({
                    feature: features, 
                    featureType: featureCategory, 
                    // tempRange: startTime+","+endTime
                })

            $.ajax({
                  type: "POST",
                  context: this,
                  contentType: "application/json; charset=utf-8",
                  url: "/getSensorData",
                  data: input,
                  success: this.foundSensors,
                  error: this.errorLog,
                  dataType: "json"
                });

            vlSpec = {
              "description": "A trellis bar chart showing the US population distribution of age groups and gender in 2000.",
              "data": { "url": "https://vega.github.io/vega-editor/app/data/population.json"},
              "transform": {
                "filter": "datum.year == 2000",
                "calculate": [{"field": "gender", "expr": "datum.sex == 2 ? \"Female\" : \"Male\""}]
              },
              "mark": "bar",
              "encoding": {
                "row": {"field": "gender", "type": "nominal"},
                "y": {
                  "aggregate": "average", "field": "people", "type": "quantitative",
                  "axis": {"title": "population"}
                },
                "x": {
                  "field": "age", "type": "ordinal",
                  "scale": {"bandSize": 17}
                },
                "color": {
                  "field": "gender", "type": "nominal",
                  "scale": {"range": ["#FFFFFF","#DDDDDD"]}
                }
              }
            }

            var embedSpec = {
              mode: "vega-lite",
              spec: vlSpec
            }

            vg.embed("#vis", embedSpec, function(error, result) {
              // Callback receiving the View instance and parsed Vega spec
              // result.view is the View, which resides under the '#vis' element
            });
            console.log("add to #vis")
            $('#vis').append("<button class='button-primary getForm'>Back to form</button>")
        },
        removeMarker: function(){
            console.log("remove marker");
        }


    });

     

    var listView = new ListView();
    

    })(jQuery);
    