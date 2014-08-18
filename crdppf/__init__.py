# -*- coding: utf-8 -*-
from pyramid.config import Configurator
from sqlalchemy import engine_from_config
import sqlahelper
from pyramid.session import UnencryptedCookieSessionFactoryConfig
from pyramid.mako_templating import renderer_factory as mako_renderer_factory
from papyrus.renderers import GeoJSON
import papyrus

import os
import yaml

def includeme(config):
    """ This function returns a Pyramid WSGI application.
    """
    
    settings = config.get_settings()
    
    engine = engine_from_config(
        settings,
        'sqlalchemy.',
        convert_unicode=False,
        encoding='utf-8'
        )
    sqlahelper.add_engine(engine)

    specific_tmp_path = os.path.join(settings['specific_root_dir'], 'templates')
    specific_static_path = os.path.join(settings['specific_root_dir'], 'static')
    settings.setdefault('mako.directories',['crdppf:templates', specific_tmp_path])
    settings.setdefault('reload_templates',True)

    global db_config
    db_config = yaml.load(file(settings.get('db.cfg')))['db_config']

    settings.update(yaml.load(file(settings.get('app.cfg'))))

    config.include(papyrus.includeme)
    config.add_renderer('.js', mako_renderer_factory)
    config.add_renderer('geojson', GeoJSON())

    # add the static view (for static resources)
    config.add_static_view('static', 'crdppf:static',cache_max_age=3600)
    config.add_static_view('proj', 'crdppfportal:static', cache_max_age=3600)
     
    # ROUTES
    config.add_route('home', '/')
    config.add_route('images', '/static/images/')
    config.add_route('create_extract', 'create_extract')
    config.add_route('get_features', 'get_features')
    config.add_route('set_language', 'set_language')
    config.add_route('get_language', 'get_language')
    config.add_route('get_translation_dictionary', 'get_translation_dictionary')
    config.add_route('get_interface_config', 'get_interface_config')
    config.add_route('get_baselayers_config', 'get_baselayers_config')
    config.add_route('test', 'test')
    config.add_route('formulaire_reglements', 'formulaire_reglements')
    config.add_route('getTownList', 'getTownList')
    config.add_route('getTopicsList', 'getTopicsList')
    config.add_route('createNewDocEntry', 'createNewDocEntry')
    config.add_route('getLegalDocuments', 'getLegalDocuments')
    config.add_route('map', 'map')

    config.add_route('globalsjs', '/globals.js')

    config.add_route('ogcproxy', '/ogcproxy')

    # VIEWS
    config.add_view('crdppf.views.entry.Entry', route_name = 'home')
    config.add_view('crdppf.views.entry.Entry', route_name = 'images')
    config.add_view('crdppf.views.entry.Entry', route_name='formulaire_reglements')
    config.add_view('crdppf.views.entry.Entry', route_name='test')
    
    config.add_route('catchall_static', '/*subpath')
    config.add_view('crdppf.static.static_view', route_name='catchall_static')
    config.scan()


