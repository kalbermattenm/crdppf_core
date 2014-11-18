 // MAIN USER INTERFACE
Ext.onReady(function() {

    
    Ext.namespace('Crdppf');
    Crdppf.topicstore = '';
    
    var formtrigger = 0;
    
    Ext.QuickTips.init();
    var winWait = new Ext.LoadMask(
        Ext.getBody(),
        {msg:"Veuillez patienter... chargement du formulaire."}
    );
   
 // Load the topic list 
    Ext.Ajax.request({
        url: 'getTopicsList',
        success: function(response) {           
            var data = Ext.decode(response.responseText);           
            var data_array = [];
            
            for (var i = 0; i < data.length; i++) {
                data_array.push([
                    data[i].topicid.toString(),
                    data[i].topicname
                ]);
            }
            
            Crdppf.topicstore = new Ext.data.ArrayStore({
                storeId: 'topicstore',
                idIndex: 0,  
                fields: [
                    {name: 'topicid', type: 'string'},
                    {name: 'topicname', type: 'string'}
                ],
                data: data_array
            });
            formtrigger += 1;
            triggerFunction(formtrigger);          
        },
        method: 'POST',
        failure: function () {
            Ext.Msg.alert(Crdppf.topics.serverErrorMessage);
        }
    });
 
    var combostore = new Ext.data.JsonStore({
        autoDestroy: true,
        autoLoad: true,
        url: 'getTownList',
        idProperty: 'idobj',
        fields:[
            {name: 'idobj'},
            {name: 'numcad', type:'integer'},
            {name: 'cadnom'},
            {name: 'numcom', type:'integer'},
            {name: 'comnom'},
            {name: 'nufeco',type:'integer'}
        ]
    }); 

    var topicslist = [];

    var cantons = new Ext.data.SimpleStore({
        autoDestroy: true,
        autoLoad: true,
        fields: [{name:'canton'}],
        data: [
            ['AG'],
            ['AI'],
            ['AR'],
            ['BE'],
            ['BL'],
            ['BS'],
            ['FR'],
            ['GE'],
            ['GL'],
            ['GR'],
            ['JU'],
            ['LU'],
            ['NE'],
            ['NW'],
            ['OW'],
            ['SH'],
            ['SZ'],
            ['SO'],
            ['SG'],
            ['TG'],
            ['TI'],
            ['UR'],
            ['VD'],
            ['VS'],
            ['ZG'],
            ['ZH']
        ]
    });
 
    // create the empty form, then fill it with values
    Crdppf.documentsForm = function() {

        var formulaire = new Ext.FormPanel({
            id: 'formulaire_saisie',
            title: 'Saisie des règlements',
            labelWidth: 200, 
            frame: true,
            bodyStyle: 'padding:5px 5px 0px',
            autoWidth: true,
            autoHeight: true,
            //renderTo:'main',
            monitorValid: true,
            items: [{
                    xtype:'numberfield',
                    fieldLabel: 'Numéro de cadastre cantonal',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    store: combostore,
                    displayField: 'numcad',
                    valueField: 'numcad',
                    name: 'numcad',
                    allowBlank: false,
                    width: 100,
                    maxLength: 2
                },{
                    xtype:'combo',
                    store: combostore,
                    displayField:'cadnom',
                    valueField: 'cadnom',
                    fieldLabel: 'Nom du cadastre',
                    triggerAction: 'all',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'nomcad',
                    allowBlank: true,
                    width: 250,
                    maxLength: 75,
                    listeners : {
                        'select' : function(combo, record){
                            formulaire.getForm().setValues({
                                numcad:record.data.numcad,
                                numcom:record.data.numcom,
                                nufeco:record.data.nufeco,
                                comnom:record.data.comnom
                            });
                        }
                    }
                },{
                    xtype:'numberfield',
                    fieldLabel: 'Numéro de commune cantonal',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'numcom',
                    id: 'numcom',
                    allowBlank: true,
                    width: 100,
                    maxLength: 2
                },{
                    xtype:'numberfield',
                    fieldLabel: 'Numéro de commune fédéral',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'nufeco',
                    allowBlank: true,
                    width: 100,
                    maxLength: 4
                },{
                    xtype:'textfield',
                    fieldLabel: 'Nom de la commune',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'comnom',
                    allowBlank: true,
                    width: 250,
                    maxLength: 75
                },{
                    xtype:'combo',
                    fieldLabel: 'Type de texte légal',
                    store: new Ext.data.ArrayStore({
                        fields: ['doctype'],
                        data: [
                            ['Base légale'],
                            ['Disposition juridique'],
                            ['Référence']
                        ]
                    }),
                    displayField: 'doctype',   
                    mode: 'local',
                    editable: false,
                    triggerAction: 'all',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'doctype',
                    allowBlank: false,
                    width: 250,
                    maxLength: 100
                },{
                    xtype:'combo',
                    name: 'topicfk',
                    store: Crdppf.topicstore,
                    mode: 'local',
                    editable: false,
                    triggerAction: 'all',
                    fieldLabel: 'Identifiant du thème',
                    displayField:'topicname',
                    valueField: 'topicid',
                    hiddenName: 'topicfk',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    allowBlank: false,
                    width: 500,
                    maxLength: 75
                },{
                    xtype:'textfield',
                    fieldLabel: 'Titre du document légal',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'titre',
                    allowBlank: true,
                    width: 500,
                    maxLength: 255
                },{
                    xtype:'textfield',
                    fieldLabel: 'Titre officiel du document légal',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'titreofficiel',
                    allowBlank: false,
                    width: 500,
                    maxLength: 255
                },{
                    xtype:'textfield',
                    fieldLabel: 'Abréviation',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'abreviation',
                    allowBlank: false,
                    width: 250,
                    maxLength: 25
                },{
                    xtype:'textfield',
                    fieldLabel: 'Numéro officiel',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'noofficiel',
                    allowBlank: false,
                    width: 500,
                    maxLength: 25
                },{
                    xtype:'textfield',
                    fieldLabel: 'Lien web du document',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'url',
                    allowBlank: false,
                    width: 500,
                    maxLength: 500
                },{
                    xtype:'textfield',
                    fieldLabel: 'Chemin vers le document',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'localurl',
                    allowBlank: false,
                    width: 500,
                    maxLength: 500
                },{
                    xtype:'combo',
                    fieldLabel: 'Statut juridique',
                    store: new Ext.data.SimpleStore({
                        fields: ['status'],
                        data: [
                            ['En vigueur'],
                            ['En cours de modification']
                        ]
                    }),
                    displayField: 'status',   
                    selectOnFocus: true,
                    mode: 'local',
                    triggerAction: 'all',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'statutjuridique',
                    allowBlank: false,
                    width: 250,
                    maxLength: 100
                },{
                    xtype:'datefield',
                    fieldLabel: 'Date de sanction',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'datesanction',
                    allowBlank: true,
                    width: 250,
                    maxLength: 100
                },{
                    xtype:'datefield',
                    fieldLabel: 'Date d\'abrogation',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'dateabrogation',
                    allowBlank: true,
                    width: 250,
                    maxLength: 100
                },{
                    xtype:'textfield',
                    fieldLabel: 'Opérateur de saisie',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'operateursaisie',
                    allowBlank: false,
                    width: 250,
                    maxLength: 100
                },{
                    xtype:'datefield',
                    fieldLabel: 'Date de saisie',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'datesaisie',
                    allowBlank: false,
                    width: 250,
                    maxLength: 100
                },{
                    xtype: 'combo',
                    store:cantons,
                    fieldLabel: 'Canton',
                    displayField:'canton',
                    labelStyle: 'white-space: nowrap;font-weight: bold;',
                    name: 'canton',
                    selectOnFocus: true,
                    mode: 'local',
                    allowBlank: true,
                    width: 250,
                    maxLength: 100
                }   
            ],

            buttons: [{
                text: 'Enregistrer',
                handler: function(){
                     //add form validation
                    var formvalues =formulaire.getForm().getValues();
                    winWait.show();
                    var transaction =Ext.Ajax.request({
                        url: 'createNewDocEntry',
                        method: 'POST',
                        params:{
                            data: Ext.encode(formvalues)
                        },
                        success:function(result,request) {
                            winWait.hide();
                            Ext.Msg.alert('Confirmation','Les données ont été enregistrées');
                        },
                        failure: function () {
                            winWait.hide();
                            Ext.Msg.alert('Error','Problème de serveur, veuillez contacter l\'administrateur.');
                        }
                    });
                }
            },{
                text: 'Cancel'
            }]
        });
      
        return formulaire;
    };

    var triggerFunction = function(counter) {
        
        if (counter == 1) {
            // create the header panel containing the page banner
            var headerPanel = new Ext.Panel({
                region: 'north',
                height: 55,
                border: false,
                contentEl: 'header'
            });
          
            // Container for the map and legal documents display
            var contentPanel = new Ext.Panel({
                region: 'center',
                margins: '5 5 0 0',
                layout: 'fit',
                items: [
                    Crdppf.documentsForm()        
                ],
                tbar: Crdppf.adminToolbar(Crdppf.labels)
            });
            
            // Main window layout
            var crdppf = new Ext.Viewport({
                layout: 'border',
                renderTo:'main',
                id:'viewPort',
                border:true,
                items: [
                    headerPanel,
                    contentPanel
                ]
            });
        }
    };
});