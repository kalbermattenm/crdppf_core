﻿Ext.namespace('Crdppf');

Crdppf.LayerTreePanel = function(labels, layerList, baseLayersList) {
    this.layerTree = this.init(labels, layerList, baseLayersList);
};

Crdppf.LayerTreePanel.prototype = {
    /***
    * Property: list of all current overlays
    ***/
    overlaysList: [],
    /***
    * Object: Layer tree
    ***/
    layerTree: null,
    /***
    * Method: initialize the layerTree
    ***/
    init: function(labels, layerList, baseLayersList) {
        var layerTree = new Ext.tree.TreePanel({
            title: labels.layerTreeTitle,
            collapsible: true,
            flex: 1.0,
            useArrows: true,
            animate: true,
            lines: true,
            enableDD: false,
            autoScroll: true,
            rootVisible: false,
            frame: true,
            id: 'layerTree'
        });

        // define root node
        var rootLayerTree = new Ext.tree.TreeNode({
            text: 'rootLayerTree',
            draggable: false,
            id:'rootLayerTree'
        });

        var ll = layerList.themes;

        // create a node on top of tree to select all nodes
        var checkAllNode = new Ext.tree.TreeNode ({
            text: labels.selectAllLayerLabel,
            id: 'selectAllNode',
            draggable: false,
            cls: 'checkAllNodeCls',
            checked: false,
            leaf: true,
            listeners: {
                'checkchange': function(node,checked){
                    if(checked){
                        layerTree.expandAll();
                        for (var n=1; n < rootLayerTree.childNodes.length; n++){
                            if( rootLayerTree.childNodes[n].id != 'baseLayers') {
                                rootLayerTree.childNodes[n].getUI().toggleCheck(true);
                            }
                        }
                        Crdppf.FeaturePanel.setInfoControl();
                    } else {
                        Crdppf.LayerTreePanel.overlaysList.length = 0;
                        for (var n=1; n < rootLayerTree.childNodes.length; n++){
                            if( rootLayerTree.childNodes[n].id != 'baseLayers') {
                                rootLayerTree.childNodes[n].getUI().toggleCheck(false);
                            }
                        }
                        layerTree.collapseAll();
                        Ext.getCmp('panButton').toggle(true);
                    }
                }
            }
        });

        rootLayerTree.appendChild(checkAllNode);
        // iterate over themes and create nodes
        for (i=0;i<ll.length;i++){
            var themeId = ll[i].id;
            // fill tree with nodes relative to themes (level 1)
            var themeNode =  new Ext.tree.TreeNode({
                text: labels[ll[i].name],
                draggable: false,
                id: ll[i].id,
                leaf: false,
                checked: false,
                listeners: {
                    'checkchange': function(node, checked){
                        var filter = {};
                        if (checked){
                            filter[node.id] = checked;
                            Crdppf.docfilters({'topicfk':filter});
                            node.expand();
                            Crdppf.updateLayers = false;
                            for (var k=0; k < node.childNodes.length; k++){
                                node.childNodes[k].getUI().toggleCheck(true);
                                if (Crdppf.LayerTreePanel.overlaysList.indexOf(node.childNodes[k].id) == -1) {
                                    Crdppf.LayerTreePanel.overlaysList.push(node.childNodes[k].id);
                                }
                            }
                            Crdppf.updateLayers = true;
                            Crdppf.Map.setOverlays();
                            Crdppf.FeaturePanel.setInfoControl();
                        } else {
                            filter[node.id] = checked;
                            Crdppf.docfilters({'topicfk':filter});                
                            node.collapse();
                            Crdppf.updateLayers = false;
                            for (var k=0; k < node.childNodes.length; k++){
                                node.childNodes[k].getUI().toggleCheck(false);
                                Crdppf.LayerTreePanel.overlaysList.remove(node.childNodes[k].id);
                            }
                            Crdppf.updateLayers = true;
                            Crdppf.Map.setOverlays();
                            Crdppf.FeaturePanel.setInfoControl();
                        }
                    }
                }
            });
            // fill each theme node with his contained node (level 2)
            for (var keys in ll[i].layers) {
                var layerNode =  new Ext.tree.TreeNode ({
                    text: labels[keys],
                    draggable: false,
                    id: keys,
                    cls:'layerNodeCls',
                    leaf: true,
                    checked:false,
                    listeners: {
                            'checkchange': function(node, checked){
                                if (checked){
                                    if(Crdppf.updateLayers) {
                                        if (Crdppf.LayerTreePanel.overlaysList.indexOf(node.id) == -1) {
                                            Crdppf.LayerTreePanel.overlaysList.push(node.id);
                                        }
                                        Crdppf.Map.setOverlays();
                                        Crdppf.FeaturePanel.setInfoControl();
                                    }
                                } else {
                                    Crdppf.LayerTreePanel.overlaysList.remove(node.id);
                                    if(Crdppf.updateLayers) {
                                        Crdppf.Map.setOverlays();
                                    }
                                    Crdppf.FeaturePanel.setInfoControl();
                                }
                            }
                        }
                    });
                themeNode.appendChild(layerNode);
            }
            rootLayerTree.appendChild(themeNode);
        }

        // Top node of the base layers group
        var baseLayersNode = new Ext.tree.TreeNode({
            text: labels.baseLayerGroup,
            cls:'baseLayersNodeCls',
            id: 'baseLayers',
            draggable: false,
            leaf: false,
            expanded: true
        });

        // create nodes for base layers
        var baseLayers = baseLayersList.baseLayers;

        // iterate over base layers and create nodes
        for (var i=0; i<baseLayers.length; i++){
            // default: check first layer
            isChecked = false;
            if (i === 0){
                isChecked = true;
            }

            // fill tree with nodes relative to baseLayers
            var baseLayerItem =  new Ext.tree.TreeNode ({
                text: labels[baseLayers[i].name],
                draggable:false,
                id: baseLayers[i].wmtsname,
                format: baseLayers[i].tile_format,
                leaf: true,
                checked: isChecked,
                cls: 'baseLayerNodeCls',
                listeners: {
                    'checkchange': function(node, checked){
                        if(checked){
                            for (var k=0; k < node.parentNode.childNodes.length; k++){
                                if(node.parentNode.childNodes[k].id != node.id){
                                    node.parentNode.childNodes[k].getUI().toggleCheck(false);
                                } else {
                                    // set new backgound layer
                                    var theBaseLayer = Crdppf.Map.map.getLayersBy('id', 'baseLayer')[0];
                                    
                                    if(theBaseLayer) {
                                        theBaseLayer.destroy();
                                    }
                                    var formatSuffixMap;
                                     
                                    if (node.attributes.format == 'image/png'){
                                         formatSuffixMap = {'image/png':'png'};
                                    }
                                    if (node.attributes.format == 'image/jpg'){
                                         formatSuffixMap = {'image/jpeg':'jpg'};
                                    }
                                    if (node.attributes.format == 'image/jpeg'){
                                         formatSuffixMap = {'image/jpeg':'jpeg'};
                                    }
                                    var layer = new OpenLayers.Layer.WMTS({
                                        name: "Base layer",
                                        url: Crdppf.mapproxyUrl,
                                        layer: node.id,
                                        matrixSet: Crdppf.mapMatrixSet,
                                        format: node.attributes.format,
                                        formatSuffixMap: formatSuffixMap,
                                        isBaseLayer: true,
                                        style: 'default',
                                        fixedLayer: true,
                                        requestEncoding: 'REST'
                                    }); 

                                    layer.id = 'baseLayer';
                                    Crdppf.Map.map.addLayers([layer]);
                                    layer.redraw();
                                }
                            }
                        }
                    }
                }
            });
            baseLayersNode.appendChild(baseLayerItem);
        }

        rootLayerTree.appendChild(baseLayersNode);
        layerTree.setRootNode(rootLayerTree);

        return layerTree;
    }
};
