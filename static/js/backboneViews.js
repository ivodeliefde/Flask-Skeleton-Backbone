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
            if (window.disableHighlight == true){
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
          'click button.getSensorData' : 'getSensorData',
          'click button.removeMarker' : 'removeMarker',
          'click button.download' : 'downloadCSV'
        },
        form1Template: _.template($('#form1Template').html()),
        form2Template: _.template($('#form2Template').html()),

        initialize: function() {
            window.disableHighlight = false
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
                };
            };

            window.features = features.join("");
            console.log( window.features );

            // console.log("split: "+window.features.split(",")[0]+"|"+window.features.split(",")[1]+"\nlength: "+window.features.split(",").length)


            window.featureCategory = $('#featureInputType').val();
            if (window.featureCategory.indexOf("Raster") > -1){
                window.featureCategory = "raster";
            };

            console.log(window.featureCategory);
            window.obsProperty = "http://dbpedia.org/resource/"+$('#obsProperty').val();
            window.observedPropertyShort = $('#obsProperty').val();
            console.log(window.obsProperty);

            problems = []

            if (features.length == 0){
                $('#featureInput').css('border','2px solid red');
                problems.push("features");
            };
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
                $('.getGraph').html('Loading...');
                $('button.getGraph').prop('disabled', true);
                $('button.getForm').prop('disabled', true);
                $('#featureInput').attr("disabled", "disabled");
                $('#featureInputType').attr("disabled", "disabled"); 
                $('#obsProperty').attr("disabled", "disabled"); 
                // $('#tempGranValue').attr("disabled", "disabled"); 
                // $('#tempGranUnit').attr("disabled", "disabled"); 
                // $('#slider').dateRangeSlider("disable");
                // alert("Still under construction.. Sorry!");
                input = JSON.stringify({
                    feature: window.features, 
                    featureType: window.featureCategory, 
                    obsProperty: window.obsProperty
                });
                window.disableHighlight = true;
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

                
            };



            
        },
        getGeoJSON: function(){
            this.input = this.$('#featureInputType');

            $("#featureInput").val('');
            // console.log($("#featureInput"));

            MapView.loadGeoJSON(this.input.val());


        },
        getForm1: function(){
            window.disableHighlight = false;
            $("#vis").html(this.form1Template);

            // $("#slider").dateRangeSlider();

        },
        getForm2: function(){
                $("#vis").html(this.form2Template);

                $("#slider").dateRangeSlider();

        },
        cleanup: function(){
            // $("#vis").css('overflow','none');
            MapView.loadGeoJSON('Municipality');
            this.getForm1();

        },
        foundSensors: function (data) {
            
            window.sensors = JSON.parse(data.sensors)
            console.log(window.sensors.type);
           
            

            window.geojsonSensors = L.geoJson(window.sensors,{
                onEachFeature: this.onEachMarker,
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
            window.map.fitBounds(window.geojsonSensors.getBounds());
            
            this.getForm2();
                
        },
        errorLog: function(e,f){
            console.log("error ");
            console.log(e);
            console.log(f);
        },

        getSensorData: function(){
            console.log("Get sensor data");
            window.temporalGranularity = $('#tempGranValue').val() +" "+ $('#tempGranUnit').val();
            if (String($('#tempGranValue').val()) == "1"){
                window.temporalGranularity = window.temporalGranularity.slice(0, -1);
            }
            console.log(window.temporalGranularity);
            window.tempAggType = $('#temporalAggType').val();
            console.log("temporal aggregation: "+window.tempAggType);
            window.spatialAggType = $('#spatialAggType').val();
            console.log("spatial aggregation: "+window.spatialAggType);
            window.startTime = new Date($('#slider').dateRangeSlider("values").min.setUTCHours(0)).toISOString();
            console.log(window.startTime);
            window.endTime = new Date($('#slider').dateRangeSlider("values").max.setUTCHours(0)).toISOString();
            console.log(window.endTime);

            MapView.loadGeoJSON(undefined);

            problems = []

            if ($('#tempGranValue').val().length == 0){
                $('#tempGranValue').css('border','2px solid red');
                problems.push("a temporal granularity value");
            }
            if (window.endTime <= window.startTime){
                $('#slider').css('border','2px solid red');
                problems.push("a valid temporal range");
            }
            // if ()
            console.log(problems);
            if (problems.length > 0){
                errorText = '<h5>Please select '+problems.join(' & ')+'</h5>';
                $('#error').html(errorText);
            } else {
                console.log("send data");
                $('#error').html('');
                $('.getSensorData').html('Loading...');
                $('button.getSensorData').prop('disabled', true);
                $('button.getForm').prop('disabled', true);
                $('#tempGranValue').attr("disabled", "disabled"); 
                $('#tempGranUnit').attr("disabled", "disabled"); 
                $('#spatialAggType').attr("disabled", "disabled"); 
                $('#temporalAggType').attr("disabled", "disabled"); 
                $('#slider').dateRangeSlider("disable");

                var input = JSON.stringify({
                        sensors: window.sensors,
                        feature: window.features, 
                        featureType: window.featureCategory, 
                        obsProperty: window.obsProperty,
                        tempGran: window.temporalGranularity,
                        startTime: window.startTime,
                        endTime: window.endTime,
                        tempAggType: window.tempAggType,
                        spatialAggType: window.spatialAggType
                    });

                $.ajax({
                      type: "POST",
                      context: this,
                      contentType: "application/json; charset=utf-8",
                      url: "/getSensorData",
                      data: input,
                      success: this.createGraph,
                      error: this.errorLog,
                      dataType: "json"
                    });
            }
            
        },
        removeMarker: function(e){
            console.log("remove marker");
            window.geojsonSensors.clearLayers();
            var uri = $(e.currentTarget).attr('name')
            for (var feature in window.sensors.features) {    
                // console.log(window.sensors.features[feature].properties);
                if (window.sensors.features[feature].properties != undefined) {
                    if (uri == window.sensors.features[feature].properties.sensorUri){
                        // console.log("delete "+window.sensors.features[feature].properties.sensorUri);
                        // console.log(window.sensors.features[feature]);
                        // console.log(window.sensors.features.length);
                        delete window.sensors.features.splice( feature, 1);
                        // console.log(window.sensors.features.length);
                    }
                }
               
                
            }
            // console.log(window.sensors);
            window.geojsonSensors = L.geoJson(window.sensors,{
                onEachFeature: this.onEachMarker,
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
        },
        createGraph: function(response){
            // console.log("create graph");
            // console.log(data);
            var sensorData = JSON.parse(response.data);
            console.log(sensorData);
            window.csvData = [];

            if (window.spatialAggType == 'raw'){

            } else {
                for (var feature in sensorData.features) {    
                    // console.log(feature);
                    // console.log(sensorData.features[feature].properties);
                    if (sensorData.features[feature].properties != undefined) {
                        // console.log(sensorData.features[feature].properties);
                        window.uom = sensorData.features[feature].properties.uom;
                        console.log("UOM: "+sensorData.features[feature].properties.uom);
                        var csvDataArray = sensorData.features[feature].properties.observationDataArray.split(sensorData.features[feature].properties.blockSeparator);
                        for (i = 0; i < csvDataArray.length; i++){
                            var row = csvDataArray[i].split(sensorData.features[feature].properties.tokenSeparator);
                            // row[0] = Date.parse(row[0].split(sensorData.features[feature].properties.decimalSeparator)[0]);
                            // row[1] = Date.parse(row[1].split(sensorData.features[feature].properties.decimalSeparator)[0]);
                            var time = row[0].split(sensorData.features[feature].properties.decimalSeparator)[0];
                            var observation = row[2];
                            var newRow = {"name": sensorData.features[feature].properties.name, "time": time, "observation": observation};
                            // console.log(newRow);
                            window.csvData.push(newRow);
                        }
                    }
                }
                console.log(csvData);

                vlSpec = {
                  "description": window.observedPropertyShort + "observation data per "+window.temporalGranularity.toLowerCase(),
                  "data": { "values": csvData },
                  "mark": "bar",
                  "encoding": {
                    "column": {
                        "field": "time", 
                        "type": "nominal", 
                        "scale": {"padding": 4},
                        "axis": {"orient": "bottom", "axisWidth": 1, "offset": -8, "labelAngle": 270}
                    },
                    "y": {
                      "aggregate": "average", "field": "observation", "type": "quantitative",
                      "axis": {"title": window.observedPropertyShort+"Observation ("+window.uom+") per "+window.temporalGranularity.toLowerCase(), "grid": false}
                    },
                    "x": {
                      "field": "name", "type": "nominal",
                      "scale": {"bandSize": 17},
                      "axis": false
                    },
                    "color": {
                      "field": "name", "type": "nominal",
                      "scale": {"range": [ "#673ab7", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800"]}
                    }
                  },
                  "config": {"facet": {"cell": {"strokeWidth": 0}}}
                }

                var embedSpec = {
                  mode: "vega-lite",
                  spec: vlSpec
                }

                // $("#vis").css('background-color', 'white');

                // $("#vis").css("-webkit-transform", "rotate(90deg)")
                // $("#vis").css("-moz-transform", "rotate(90deg)")
                // $("#vis").css("-o-transform", "rotate(90deg)")
                // $("#vis").css("-ms-transform", "rotate(90deg)")
                // $("#vis").css("transform", "rotate(90deg)")

                vg.embed("#vis", embedSpec, function(error, result) {
                  // Callback receiving the View instance and parsed Vega spec
                  // result.view is the View, which resides under the '#vis' element
                    if (error != null){
                        console.log(error,result);
                    }
                  
                });
                // $("#vis").css('overflow-x','scroll');
                console.log("add to #vis");
            };
            
            $('#visDiv').append("<button class='six columns download'>Download Sensor Data</button>");
            $('#visDiv').append("<button class='button-primary getForm'>Back to form</button>");
            console.log(sensorData);
            window.polygonCount = 0;
            window.geojsonSensorData = L.geoJson(sensorData,{
                style: this.stylePolygon,
                onEachFeature: this.onEachFeature
            }).addTo(window.map);
                // ,{
                // s?tyle: MapView.style(),
                // onEachFeature: this.onEachFeature,
                // pointToLayer: function (feature, latlng) {
                // return L.circleMarker(latlng, {
                //     radius: 8,
                //     fillColor: "#ff7800",
                //     color: "#000",
                //     weight: 1,
                //     opacity: 1,
                //     fillOpacity: 0.8
                //     });
                // }
            // }
            // ).addTo(window.map);
            window.map.fitBounds(window.geojsonSensorData.getBounds());


        },
        onEachMarker: function(feature, layer) {
            var popupContent = "<div class='row' id='popup'><table><tr><th colspan='2'><center><h1>Sensor</h1></center></th></tr><tr><td>URI</td><td><a href='"+feature.properties.sensorUri+"' target=_blank>" + feature.properties.sensorUri +"</td></tr><tr><td>Observed property</td><td><a href='" + feature.properties.observedProperty[1]  +"' target=_blank>"+feature.properties.observedProperty[1]+"</td></tr><tr><td>SOS</td><td><a href='" + feature.properties.sos  +"service=SOS&version=2.0.0&request=GetCapabilities' target=_blank>" + feature.properties.sos +"</a></td></tr></table><button class='removeMarker' name='"+feature.properties.sensorUri+"'>Remove</button></div>";

            layer.bindPopup(popupContent);
        }, 
        onEachFeature: function(feature, layer) {
            layer.on({
                mouseover: function(){console.log("mouseover");},
                mouseout: function(){console.log("mouseout");}

            });
        },
        stylePolygon: function(){
            console.log(window.features.split())
            console.log('Number of features: '+window.features.split(",").length);
            var opacity = 0.7;
            if (window.polygonCount+1 > window.features.split(",").length){
                var color = "#000000";
                opacity = 0;
            } else {
                if (window.spatialAggType == "raw"){
                    var color = "#FFEDA0";
                } else{
                    var color = vlSpec.encoding.color.scale.range[window.polygonCount];
                }
                
            }
            // console.log(vlSpec.encoding.color.scale.range);
            console.log(window.polygonCount);
            console.log(color);
            window.polygonCount++;
            return {
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: opacity,
                fillColor: color
            } 
        },
        downloadCSV: function(){
            var dl = document.createElement('a');
            dl.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent( JSON.stringify(window.csvData) ));
            dl.setAttribute('download', 'sensordata.json');
            dl.click();
        }

    });

     

    var listView = new ListView();
    

    })(jQuery);
    