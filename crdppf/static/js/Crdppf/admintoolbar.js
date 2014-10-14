Ext.namespace('Crdppf');

// create layer tree and append nodes & subnodes to it
Crdppf.adminToolbar = function(labels) {
    
    var toolbar = new Ext.Toolbar();

   toolbar.add({
            text:'Application',
            iconCls: 'crdppf_application_menu',
            menu: {
                xtype: 'menu',
                plain: true,
                items:[{
                    text: 'Configuration de l\'application',
                    handler: function() {
                        window.location = 'configpanel';
                    }
                },{
                    text: 'Afficher les traductions',
                    handler: function() {
                        window.location = 'get_translations';
                    }
                },{
                    text: 'Afficher les couches',
                    handler: function() {
                        window.location = 'get_layers';
                    }
                }]
            }
        },'-',{
            text: 'Documents',
            iconCls: 'crdppf_documents_menu',
            menu: {
                xtype: 'menu',
                plain: true,
                items: [{
                    text: 'Saisir un document',
                    handler: function() {
                        window.location = 'formulaire_reglements';
                    }
                },{
                    text: 'Gestion des references',
                    handler: function() {
                        window.location = 'get_doclist';
                    }
                }]
            }
        },'-',{
            text: 'Extrait PDF',
            iconCls: 'crdppf_extract_menu',
            menu: {
                xtype: 'menu',
                plain: true,
                items:[{
                    text: 'Configuration de l\'extrait',
                    handler: function() {
                        window.location = 'get_pdfconfig';
                    }
                },{
                    text: 'Configuration de la SLD',
                    handler: function() {
                        window.location = 'get_SLD';
                    }
                }]
            }
        },'-',{
            text: 'Openlayers',
            iconCls: 'crdppf_openlayers_menu',
            menu: {
                xtype: 'menu',
                plain: true,
                items:[{
                    text: 'Configuration Openlayers',
                    handler: function() {
                        window.location = 'get_OLconfig';
                    }
                }]
            }
        },'-',{
            text: 'Retour au portail CRDPPF',
            iconCls: 'crdppf_menu_home',
            handler: function() {
                if (document.URL == '/') {
                    alert('Mais, t\'es déjà sur le CRDPPF...');
                    return;
                }
                window.location = '/';
            }
        }
    );
    
   toolbar.doLayout();
    return toolbar;
};
