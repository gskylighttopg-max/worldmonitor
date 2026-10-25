import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { addConflictLayer } from './layers/ConflictLayer.js';
import { addOilLayer } from './layers/OilLayer.js';
import { addNewsLayer } from './layers/NewsLayer.js';
import { handleClusterClick, handlePointClick, handleCountryClick } from './handlers.js';
import { API_URL } from '../api.js';

export class MapLibreMap {
  constructor(containerId, options = {}) {
    this.map = new maplibregl.Map({
      container: containerId,
      style: options.style || 'https://demotiles.maplibre.org/style.json',
      center: options.center || [0, 20],
      zoom: options.zoom || 1.5,
      pitch: options.pitch || 0,
      bearing: options.bearing || 0,
      antialias: true
    });
    
    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    
    this.layers = {};
    this.popups = [];
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.map.on('load', () => {
      this.addCountryBoundaries();
    });
  }
  
  async addCountryBoundaries() {
    try {
      const res = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json');
      const countries = await res.json();
      
      this.map.addSource('countries', {
        type: 'geojson',
        data: countries
      });
      
      this.map.addLayer({
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': 'transparent',
          'fill-outline-color': 'rgba(100,100,100,0.3)'
        }
      });
      
      this.map.addLayer({
        id: 'countries-border',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': '#999',
          'line-width': 0.5
        }
      });
      
      this.map.on('click', 'countries-fill', (e) => {
        handleCountryClick(this.map, e, API_URL);
      });
      
      this.map.on('mouseenter', 'countries-fill', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', 'countries-fill', () => {
        this.map.getCanvas().style.cursor = '';
      });
    } catch (error) {
      console.error('Failed to load country boundaries:', error);
    }
  }
  
  addConflictLayer(data) {
    const handlers = addConflictLayer(this.map, 'conflicts', data);
    this.layers.conflicts = handlers;
    
    this.map.on('click', 'conflicts-clusters', (e) => handlers.onClusterClick(e));
    this.map.on('click', 'conflicts-unclustered', (e) => handlers.onPointClick(e));
    
    this.map.on('mouseenter', 'conflicts-clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'conflicts-clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });
    this.map.on('mouseenter', 'conflicts-unclustered', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'conflicts-unclustered', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }
  
  addOilLayer(data) {
    const handlers = addOilLayer(this.map, 'oil', data);
    this.layers.oil = handlers;
  }
  
  addNewsLayer(data) {
    const handlers = addNewsLayer(this.map, 'news', data);
    this.layers.news = handlers;
  }
  
  getMap() {
    return this.map;
  }
  
  destroy() {
    this.popups.forEach(p => p.remove());
    this.popups = [];
    this.map.remove();
  }
}