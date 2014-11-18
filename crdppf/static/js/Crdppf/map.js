/*
 * @include OpenLayers/Projection.js
 * @include OpenLayers/Map.js
 * @requires OpenLayers/Request.js 
 * @requires OpenLayers/Layer/WMTS.js 
 * @requires OpenLayers/Layer/Image.js 
 * @requires OpenLayers/Control/LayerSwitcher.js
 * @requires OpenLayers/Control/OverviewMap.js
 * @requires OpenLayers/Control/PanZoomBar.js
 * @requires OpenLayers/Control/GetFeature.js
 * @requires OpenLayers/Control/ScaleLine.js
 * @requires OpenLayers/Control/Measure.js
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Handler/Polygon.js
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Util.js 
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/Control/Navigation.js
 * @include OpenLayers/Layer/WMS.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Format/GML.js
 * @include OpenLayers/Format/GeoJSON.js
 * @include OpenLayers/Renderer/Canvas.js
 * @include OpenLayers/Renderer/Elements.js
 * @include OpenLayers/Renderer/SVG.js
 * @include OpenLayers/Renderer/VML.js
 * @include OpenLayers/Protocol/WFS/v1_0_0.js
 * @include OpenLayers/Protocol/WFS.js
 */
 
Ext.namespace('Crdppf');
OpenLayers.ImgPath = Crdppf.OLImgPath;  

// Constructor
Crdppf.Map = function Map(mapOptions, labels) {
    this.title = 'Crdppf OpenLayers custom map object';
    this.description = 'Manages all cartographic parameters and actions';       
    this.map = makeMap(mapOptions, labels);
    this.setOverlays = setOverlays;
    this.setInfoControl = setInfoControl;
    this.disableInfoControl = disableInfoControl;
};

// Create the infocontrols supporting the getFeatureInfo functionnalities
var setInfoControl = function setInfoControl(){
    
    // avoid duplicating infoControls
    MapO.disableInfoControl();
    
    // remove all features in featureTree rootNode
    root.removeAll(true);

    OpenLayers.ProxyHost= Crdppf.ogcproxyUrl;
    // create OL WFS protocol
    var protocol = new OpenLayers.Protocol.WFS({
        url: Crdppf.ogcproxyUrl,
        geometryName: this.geometryName,
        srsName: this.map.getProjection(),
        featureType: 'parcelles',
        formatOptions: {
            featureNS: 'http://mapserver.gis.umn.edu/mapserver',
            autoconfig: false
        }
    });
    
    // create infoControl with our WFS protocol
   var control = new OpenLayers.Control.GetFeature({
        protocol: protocol,
        id: 'infoControl001',
        box: false,
        hover: false,
        single: false,
        maxFeatures: 1,
        clickTolerance: 15
    });
    
    // define actions on feature selection
    control.events.register("featureselected", this, function(e) {
        featureTree.expand(true);
        intersect.removeAllFeatures();
        select.addFeatures([e.feature]);
        var parcelId = e.feature.attributes.idemai;
        Crdppf.docfilters({'municipalitynb':parseInt(parcelId.split('_',1)[0])});
        if(overlaysList.length === 0){
            var top =  new Ext.tree.TreeNode({
                text: Crdppf.labels.noActiveLayertxt,
                draggable:false,
                leaf: true,
                expanded: true
            });
            root.appendChild(top);
        }
        else { // send intersection request and process results
                function handler(request) {
                    var geojson_format = new OpenLayers.Format.GeoJSON();
                    var jsonData = geojson_format.read(request.responseText);
                    featureTree.setTitle(Crdppf.labels.restrictionPanelTxt + parcelId);
                    lList = [];
                    // iterate over the restriction found
                    for (i=0; i<jsonData.length;i++) {
                        lName = jsonData[i].attributes.layerName;
                        // create node for layer if not already created
                        if(!contains(lName,lList)){
                            var fullName = '';
                            var ll = Crdppf.layerList.themes;
                            for (l=0;l<ll.length;l++){
                                for (var key in ll[l].layers){
                                    if(lName==key){
                                        fullName = Crdppf.labels[key]; 
                                    }
                                }
                            }
                            // create layer node (level 1, root is level 0 in the hierarchy)
                            var layerChild =  new Ext.tree.TreeNode({
                                text: fullName,
                                draggable:false,
                                id:guid(),
                                leaf: false,
                                expanded: true
                            });
                            
                            // iterate over all features: create a node for each restriction and group them by their owning layer
                            for (j=0; j<jsonData.length; j++) {
                                if (jsonData[j].attributes.layerName == lName){
                                    featureClass = jsonData[j].attributes.featureClass;
                                    html = '';
                                    for (var value in jsonData[j].attributes){
                                        if (value !== 'geomType' && value !=='theme' && value!=='codegenre' && value!=='intersectionMeasure'){
                                            html += '<p class=featureAttributeStyle><b>' + Crdppf.labels[value] + ' : </b>' + jsonData[j].attributes[value] +'</p>' ;
                                        }
                                    }
                                    html += '';
                                    // create 1 node for each restriction (level 2)
                                    var sameLayerNode = new Ext.tree.TreeNode({
                                        singleClickExpand: true,
                                        attributes: jsonData[j],
                                        text: Crdppf.labels.restrictionFoundTxt + (j+1) + ' : ' + String(jsonData[j].data.intersectionMeasure),
                                        draggable:false,
                                        leaf: false,
                                        expanded: false,
                                        id: guid(),
                                        listeners: {
                                            'click': function(node,e) {
                                                intersect.removeAllFeatures();
                                                feature = node.attributes.attributes;
                                                intersect.addFeatures(feature);
                                                MapO.map.zoomToExtent(feature.geometry.bounds);
                                            }
                                        }
                                    });
                                    // create node containing the feature attributes (level 3)
                                    var contentNode = new Ext.tree.TreeNode({
                                        cls:'contentNodeCls',
                                        text:html,
                                        draggable:false,
                                        leaf: false,
                                        expanded: false,
                                        id: guid()
                                    });
                                    sameLayerNode.appendChild(contentNode);
                                    layerChild.appendChild(sameLayerNode);
                                }
                                root.appendChild(layerChild);
                            }
                            lList.push(lName);
                        }
                    }               
            }
            // define an request object to the interection route
            
            var featureMask = new Ext.LoadMask(featureTree.body, {msg: Crdppf.labels.restrictionLoadingMsg});
            featureMask.show();
            
            var request = OpenLayers.Request.GET({
                url: Crdppf.getFeatureUrl,
                params: {
                    id: parcelId,
                    layerList: overlaysList
                },
                callback: handler,
                success: function(){
                    featureMask.hide();
                },
                failure: function(){
                    featureMask.hide();
                },
                proxy: null
            });
        }       
    });
    control.events.register("featureunselected", this, function(e) {
        select.removeFeatures([e.feature]);
        root.removeAll(true);
    });
    this.map.addControl(control);
    control.activate();
};

// Create OL map object, add base layer & zoom to max extent
function makeMap(mapOptions, labels){

    // base layer: topographic layer
    var layer = new OpenLayers.Layer.WMTS({
        name: "Base layer",
        url: Crdppf.mapproxyUrl,
        layer: Crdppf.tileNames.plan_cadastral_name,
        matrixSet: Crdppf.mapMatrixSet,
        format: 'image/png',
        isBaseLayer: true,
        style: 'default',
        fixedLayer: true,
        requestEncoding: 'REST'
    }); 
    
    layer.id = 'baseLayer';  
    
    var selectStyle = new OpenLayers.Style({
        'strokeColor':'#00ff00',
        'fillOpacity': '0.5',
        'fillColor': '#00ff00',
        'strokeWidth':'3',
        'pointRadius': '20'
    });    
    
    // selection layer: display selected features
    select = new OpenLayers.Layer.Vector(
        "Selection",
        {
            styleMap: selectStyle,
            fixedLayer: true, 
            displayInLayerSwitcher: false
    });
    
    select.id = 'selectionLayer';
    
    var intersectStyle = new OpenLayers.Style({
            'strokeColor':'#ff0000',
            'fillOpacity': '0.5',
            'fillColor': '#ff0000',
            'strokeWidth':'2',
            'pointRadius': '20'
        });
        
    intersect = new OpenLayers.Layer.Vector(
            "intersection result",
            {
                styleMap: intersectStyle,
                fixedLayer: true, 
                displayInLayerSwitcher: false
            }
        );
    intersect.id='intersectLayer';
    
    var scalebar = new OpenLayers.Control.ScaleLine({
        bottomOutUnits:'',
        bottomInUnits: '',
        maxWidth: 200
    });
  
    // THE OL map object
    var map = new OpenLayers.Map({
        projection: new OpenLayers.Projection(Crdppf.mapSRS),
        resolutions: Crdppf.mapResolutions,
        units: 'm',
        theme: null,
        maxExtent: new OpenLayers.Bounds(Crdppf.mapMaxExtent),
        restrictedExtent: new OpenLayers.Bounds(Crdppf.mapExtent),
        controls: [
            new OpenLayers.Control.PanZoomBar({
                slideFactor: 300,
                zoomWorldIcon: true,
                panIcons: false
            }),
            new OpenLayers.Control.Navigation(),
            scalebar            
        ]
    });   

        
    // Event registering & Control setting on the Map Object
    map.events.register("mousemove", map, function(e) {
                var pixel = new OpenLayers.Pixel(e.xy.x,e.xy.y);
                var lonlat = map.getLonLatFromPixel(pixel);
                OpenLayers.Util.getElement(mapOptions.divMousePosition).innerHTML = '<b>' + labels.olCoordinates + ' (ch1903) - Y : ' + Math.round(lonlat.lon) + ' m / X : ' + Math.round(lonlat.lat) + ' m</b>';
    });
    
    // add base layers & selection layers
    map.addLayers([intersect,select, layer]);
  
    // create an overview map control and customize it
    var overviewMap = new OpenLayers.Control.OverviewMap({
            layers: [
                new OpenLayers.Layer.Image(
                    "overview",
                    Crdppf.staticImagesDir + Crdppf.keymap,
                    new OpenLayers.Bounds(Crdppf.mapOverviewExtent),
                    new OpenLayers.Size(Crdppf.mapOverviewSizeW, Crdppf.mapOverviewSizeH)
                )
            ],
            size: new OpenLayers.Size(Crdppf.mapOverviewSizeW, Crdppf.mapOverviewSizeH),
            maximized: true,
            isSuitableOverview: function() {
                return true;
            },
            mapOptions: {
                projection: new OpenLayers.Projection(Crdppf.mapSRS),
                displayProjection: new OpenLayers.Projection(Crdppf.mapSRS),
                units: "m",
                theme: null
            }
        });
    map.addControl(overviewMap);
    map.zoomToMaxExtent(); 
        
    return map;
}

// Disable the existing infoControls
var disableInfoControl = function disableInfoControl(){
    featureTree.collapse(false);
    intersect.removeAllFeatures();
    featureTree.setTitle(Crdppf.labels.restrictionPanelTitle);
    root.removeAll(true);
    var selectionLayer = this.map.getLayer('selectionLayer');
    selectionLayer.removeAllFeatures();
    infoControl = this.map.getControl('infoControl001');
    
    if(infoControl){
        infoControl.destroy();
    }
};

/**
* Method: setOverlays
* Set the layers to be added to the map depending on the crdppf thematic selected. All layer a group in one single WMS
*
* Parameters:
* none
*/ 
var setOverlays = function() {

    // remove existing infoControl
    infoControl = this.map.getControl('infoControl001');
    if(infoControl){
        infoControl.destroy();
    }
    // empty selection layer
    var selectionLayer = this.map.getLayer('selectionLayer');
    selectionLayer.removeAllFeatures();
    
    layerName = 'Themes';
    theLayer = this.map.getLayer('overlayLayer');
    if(theLayer){
        this.map.removeLayer(theLayer);
    }
    // add new overlays
    if(overlaysList.length > 0){
        var loadMask = new Ext.LoadMask(themeSelector.body, {msg: Crdppf.labels.layerLoadingMaskMsg});
        var overlays = new OpenLayers.Layer.WMS(
            layerName, 
            Crdppf.wmsUrl,
            {
                layers: overlaysList,
                format: 'image/png',
                singleTile: true,
                transparent: 'true'
            },{
                singleTile: true,
                isBaseLayer: false
            }
        );
        
        // Listen to layers events and show loading mask whenever necessary
        overlays.events.register("loadstart", overlays, function() {
            loadMask.show();
        });        
        overlays.events.register("loadend", overlays, function() {
            loadMask.hide();
        });        
        overlays.events.register("tileloaded", overlays, function() {
            loadMask.show();
        });
        overlays.id = 'overlayLayer';
        this.map.addLayer(overlays);
        this.map.raiseLayer(this.map.getLayersBy('id', 'selectionLayer')[0], this.map.layers.length);

    }
    
};

// helping functions
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
}

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

// check if an element belongs to a list
var contains = function contains(element,list){
        for (var item in list) {
            if(list[item]==element){
                return true;
            }
        }
    return false;
};