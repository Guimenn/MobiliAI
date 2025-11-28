'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Search,
  Filter,
  X,
  Store,
  Package,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Route,
  Gauge,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { storesAPI, productsAPI } from '@/lib/api';
import { env } from '@/lib/env';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  distance?: number; // Distância em km
  storeInventory?: Array<{
    productId: string;
    productName?: string;
    quantity: number;
  }>;
}

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
}

interface GeocodeCache {
  [key: string]: {
    coords: [number, number];
    timestamp: number;
  };
}

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos
const GEOCODE_CACHE_KEY = 'geocode_cache';

export default function StoresPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('name');

  // Cache de geocodificação
  const getGeocodeCache = (): GeocodeCache => {
    if (typeof window === 'undefined') return {};
    try {
      const cached = localStorage.getItem(GEOCODE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as GeocodeCache;
        // Limpar entradas expiradas
        const now = Date.now();
        const valid: GeocodeCache = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (value && typeof value === 'object' && 'timestamp' in value && 'coords' in value) {
            if (now - (value.timestamp as number) < CACHE_DURATION) {
              valid[key] = value as { coords: [number, number]; timestamp: number };
            }
          }
        }
        localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(valid));
        return valid;
      }
    } catch (error) {
      console.error('Erro ao ler cache:', error);
    }
    return {};
  };

  const setGeocodeCache = (key: string, coords: [number, number]) => {
    if (typeof window === 'undefined') return;
    try {
      const cache = getGeocodeCache();
      cache[key] = {
        coords,
        timestamp: Date.now(),
      };
      localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  };

  // Carregar lojas e produtos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Usar endpoint público que não exige autenticação
      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      const storesResponse = await fetch(`${apiBaseUrl}/public/support/stores`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      let storesData: any = [];
      if (storesResponse.ok) {
        const data = await storesResponse.json();
        storesData = data.stores || data || [];
      } else {
        console.error('Erro ao buscar lojas do endpoint público');
      }
      
      // Buscar produtos do endpoint público (não exige autenticação)
      let productsData: any = [];
      try {
        const productsResponse = await fetch(`${apiBaseUrl}/public/products?limit=1000`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (productsResponse.ok) {
          const data = await productsResponse.json();
          productsData = data.products || data || [];
        } else {
          console.log('Endpoint público de produtos retornou erro, continuando sem filtro de produtos');
        }
      } catch (error) {
        // Se não houver endpoint público de produtos, continuar sem produtos
        console.log('Erro ao buscar produtos públicos, continuando sem filtro de produtos:', error);
        productsData = [];
      }

      // Processar lojas
      let storesArray: Store[] = [];
      if (Array.isArray(storesData)) {
        storesArray = storesData;
      } else if (storesData?.stores) {
        storesArray = storesData.stores;
      } else if (storesData?.data) {
        storesArray = storesData.data;
      }

      // Filtrar apenas lojas ativas
      storesArray = storesArray.filter((store: Store) => store.isActive);

      // Processar produtos
      let productsArray: Product[] = [];
      if (Array.isArray(productsData)) {
        productsArray = productsData;
      } else if (productsData?.products) {
        productsArray = productsData.products;
      } else if (productsData?.data) {
        productsArray = productsData.data;
      }

      // O endpoint público já retorna as lojas com storeInventory incluído
      // Não precisa mais fazer chamadas separadas para buscar estoque
      setStores(storesArray);
      setProducts(productsArray);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar lojas e produtos');
    } finally {
      setIsLoading(false);
    }
  };


  // Calcular distância usando fórmula de Haversine
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Geocodificar endereço com cache
  const geocodeAddress = async (
    address: string,
    city: string,
    state: string
  ): Promise<[number, number] | null> => {
    const cacheKey = `${address}, ${city}, ${state}`;
    const cache = getGeocodeCache();

    // Verificar cache primeiro
    if (cache[cacheKey]) {
      return cache[cacheKey].coords;
    }

    try {
      const query = encodeURIComponent(`${address}, ${city}, ${state}, Brasil`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PintAi-Loja-Tintas/1.0',
          },
        }
      );

      const data = await response.json();
      if (data && data.length > 0) {
        const coords: [number, number] = [
          parseFloat(data[0].lon),
          parseFloat(data[0].lat),
        ];
        // Salvar no cache
        setGeocodeCache(cacheKey, coords);
        return coords;
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
    }
    return null;
  };

  // Filtrar lojas por produto e calcular distâncias
  useEffect(() => {
    let filtered = [...stores];

    // Filtrar por produto selecionado
    if (selectedProduct) {
      filtered = filtered.filter((store) => {
        if (store.storeInventory && store.storeInventory.length > 0) {
          return store.storeInventory.some(
            (inv) => inv.productId === selectedProduct && inv.quantity > 0
          );
        }
        return false;
      });
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (store) =>
          store.name.toLowerCase().includes(term) ||
          store.city.toLowerCase().includes(term) ||
          store.address.toLowerCase().includes(term)
      );
    }

    // Calcular distâncias se tiver localização do usuário
    if (userLocation) {
      filtered = filtered.map((store) => {
        if (store.latitude && store.longitude) {
          const distance = calculateDistance(
            userLocation[1],
            userLocation[0],
            store.latitude,
            store.longitude
          );
          return { ...store, distance: Math.round(distance * 10) / 10 };
        }
        return store;
      });
    }

    // Ordenar
    if (sortBy === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const distA = a.distance || Infinity;
        const distB = b.distance || Infinity;
        return distA - distB;
      });
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredStores(filtered);
  }, [selectedProduct, searchTerm, stores, userLocation, sortBy]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || filteredStores.length === 0) return;

    const initMap = async () => {
      try {
        // Importar módulos do OpenLayers dinamicamente
        const ol = await import('ol');
        const { default: TileLayer } = await import('ol/layer/Tile');
        const { default: OSM } = await import('ol/source/OSM');
        const { default: VectorLayer } = await import('ol/layer/Vector');
        const { default: VectorSource } = await import('ol/source/Vector');
        const { default: Style } = await import('ol/style/Style');
        const { default: Icon } = await import('ol/style/Icon');
        const { default: Point } = await import('ol/geom/Point');
        const { default: Feature } = await import('ol/Feature');
        const { default: LineString } = await import('ol/geom/LineString');
        const { default: Stroke } = await import('ol/style/Stroke');
        const { fromLonLat } = await import('ol/proj');

        // Criar mapa
        const vectorSource = new VectorSource();
        const routeSource = new VectorSource();

        const routeLayer = new VectorLayer({
          source: routeSource,
          style: new Style({
            stroke: new Stroke({
              color: '#3e2626',
              width: 4,
            }),
          }),
        });

        routeLayerRef.current = routeLayer;

        const map = new ol.Map({
          target: mapRef.current!,
          layers: [
            new TileLayer({
              source: new OSM(),
            }),
            routeLayer,
            new VectorLayer({
              source: vectorSource,
              style: new Style({
                image: new Icon({
                  anchor: [0.5, 1],
                  src: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 11.5 16 32 16 32s16-20.5 16-32C32 7.163 24.837 0 16 0z" fill="#3e2626"/>
                      <circle cx="16" cy="16" r="8" fill="white"/>
                    </svg>
                  `),
                  scale: 1,
                }),
              }),
            }),
          ],
          view: new ol.View({
            center: fromLonLat([-46.6333, -23.5505]), // São Paulo padrão
            zoom: 10,
          }),
        });

        mapInstanceRef.current = map;

        // Adicionar marcadores para cada loja
        setIsGeocoding(true);
        const features: any[] = [];

        for (const store of filteredStores) {
          let coords: [number, number] | null = null;

          // Se já tiver coordenadas, usar elas
          if (store.latitude && store.longitude) {
            coords = [store.longitude, store.latitude];
          } else {
            // Geocodificar o endereço (com cache)
            coords = await geocodeAddress(store.address, store.city, store.state);
            // Salvar coordenadas na loja se geocodificou
            if (coords) {
              store.latitude = coords[1];
              store.longitude = coords[0];
            }
          }

          if (coords) {
            const feature = new Feature({
              geometry: new Point(fromLonLat(coords)),
              store: store,
            });

            feature.setStyle(
              new Style({
                image: new Icon({
                  anchor: [0.5, 1],
                  src: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 11.5 16 32 16 32s16-20.5 16-32C32 7.163 24.837 0 16 0z" fill="#3e2626"/>
                      <circle cx="16" cy="16" r="8" fill="white"/>
                      <text x="16" y="20" text-anchor="middle" fill="#3e2626" font-size="10" font-weight="bold">${store.name.charAt(0)}</text>
                    </svg>
                  `),
                  scale: 1,
                }),
              })
            );

            features.push(feature);
          }
        }

        vectorSource.addFeatures(features);

        // Adicionar marcador da localização do usuário se disponível
        if (userLocation) {
          const userFeature = new Feature({
            geometry: new Point(fromLonLat(userLocation)),
          });

          userFeature.setStyle(
            new Style({
              image: new Icon({
                anchor: [0.5, 0.5],
                src: 'data:image/svg+xml;base64,' + btoa(`
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#3b82f6" opacity="0.3"/>
                    <circle cx="12" cy="12" r="6" fill="#3b82f6"/>
                  </svg>
                `),
                scale: 1,
              }),
            })
          );

          vectorSource.addFeature(userFeature);
        }

        // Ajustar view para mostrar todos os marcadores
        if (features.length > 0) {
          const extent = vectorSource.getExtent();
          map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 15,
          });
        }

        setIsGeocoding(false);

        // Evento de clique no mapa
        map.on('click', (event: any) => {
          const feature = map.forEachFeatureAtPixel(event.pixel, (feature: any) => {
            return feature;
          });

          if (feature && feature.get('store')) {
            const store = feature.get('store') as Store;
            setSelectedStore(store);
          }
        });

        // Mudar cursor ao passar sobre marcadores
        map.on('pointermove', (event: any) => {
          const feature = map.forEachFeatureAtPixel(event.pixel, (feature: any) => {
            return feature;
          });
          if (mapRef.current) {
            mapRef.current.style.cursor = feature ? 'pointer' : '';
          }
        });

        return () => {
          map.setTarget(undefined);
        };
      } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
        setIsGeocoding(false);
      }
    };

    initMap();
  }, [filteredStores, userLocation]);

  // Desenhar rota quando loja for selecionada
  useEffect(() => {
    if (!showRoute || !selectedStore || !userLocation || !routeLayerRef.current) return;

    const drawRoute = async () => {
      try {
        const { fromLonLat } = await import('ol/proj');
        const { default: LineString } = await import('ol/geom/LineString');
        const { default: Feature } = await import('ol/Feature');
        const { default: Style } = await import('ol/style/Style');
        const { default: Stroke } = await import('ol/style/Stroke');

        if (!selectedStore.longitude || !selectedStore.latitude) return;

        // Usar OSRM para obter rota (gratuito e open source)
        const start = `${userLocation[0]},${userLocation[1]}`;
        const end = `${selectedStore.longitude},${selectedStore.latitude}`;
        
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
          );
          const data = await response.json();

          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord: [number, number]) =>
              fromLonLat(coord)
            );

            const routeFeature = new Feature({
              geometry: new LineString(coordinates),
            });

            routeFeature.setStyle(
              new Style({
                stroke: new Stroke({
                  color: '#3e2626',
                  width: 4,
                }),
              })
            );

            routeLayerRef.current.getSource().clear();
            routeLayerRef.current.getSource().addFeature(routeFeature);
          }
        } catch (error) {
          // Se OSRM falhar, desenhar linha reta
          const { fromLonLat } = await import('ol/proj');
          const { default: LineString } = await import('ol/geom/LineString');
          const { default: Feature } = await import('ol/Feature');
          const { default: Style } = await import('ol/style/Style');
          const { default: Stroke } = await import('ol/style/Stroke');

          const coordinates = [
            fromLonLat(userLocation),
            fromLonLat([selectedStore.longitude!, selectedStore.latitude!]),
          ];

          const routeFeature = new Feature({
            geometry: new LineString(coordinates),
          });

          routeFeature.setStyle(
            new Style({
              stroke: new Stroke({
                color: '#3e2626',
                width: 4,
                lineDash: [10, 5],
              }),
            })
          );

          routeLayerRef.current.getSource().clear();
          routeLayerRef.current.getSource().addFeature(routeFeature);
        }
      } catch (error) {
        console.error('Erro ao desenhar rota:', error);
      }
    };

    drawRoute();
  }, [showRoute, selectedStore, userLocation]);

  // Obter localização do usuário
  const getUserLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(coords);

          if (mapInstanceRef.current) {
            const { fromLonLat } = await import('ol/proj');
            const view = mapInstanceRef.current.getView();
            view.setCenter(fromLonLat(coords));
            view.setZoom(15);
          }
        },
        (error) => {
          toast.error('Não foi possível obter sua localização');
          console.error('Erro ao obter localização:', error);
        }
      );
    } else {
      toast.error('Geolocalização não suportada pelo navegador');
    }
  };

  const clearFilters = () => {
    setSelectedProduct('');
    setSearchTerm('');
  };

  const toggleRoute = () => {
    if (!userLocation) {
      toast.info('Ative sua localização primeiro para ver a rota');
      return;
    }
    if (!selectedStore) {
      toast.info('Selecione uma loja primeiro');
      return;
    }
    setShowRoute(!showRoute);
  };

  const selectedProductName = products.find((p) => p.id === selectedProduct)?.name || '';
  const selectedProductInventory = selectedStore?.storeInventory?.find(
    (inv) => inv.productId === selectedProduct
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#3e2626] mx-auto mb-4" />
            <p className="text-gray-600">Carregando lojas...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-42">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#3e2626] rounded-2xl mb-6">
            <Store className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#3e2626] mb-4">
            Nossas Lojas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Encontre a loja mais próxima de você e verifique a disponibilidade de produtos
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-8 border-2 border-[#3e2626]/10 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl">
            <CardTitle className="text-xl font-bold text-[#3e2626] flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Filtro por Produto */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3e2626] flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Buscar por Produto
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
                >
                  <option value="">Todos os produtos</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <Badge className="bg-[#3e2626] text-white mt-2">
                    Mostrando lojas com: {selectedProductName}
                  </Badge>
                )}
              </div>

              {/* Busca por Nome/Cidade */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3e2626] flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Buscar por Nome ou Cidade
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Digite o nome da loja ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-2 border-[#3e2626]/20 focus:border-[#3e2626]"
                  />
                </div>
              </div>

              {/* Ordenação */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3e2626] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'distance' | 'name')}
                  className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
                  disabled={!userLocation}
                >
                  <option value="name">Nome</option>
                  <option value="distance">Distância</option>
                </select>
              </div>
            </div>

            {(selectedProduct || searchTerm) && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredStores.length} loja(s) encontrada(s)
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="text-[#3e2626] border-[#3e2626]/20 hover:border-[#3e2626]"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mapa e Lista */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Mapa */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-2 border-[#3e2626]/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-[#3e2626]">
                    Localização das Lojas
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={getUserLocation}
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-gray-100 text-[#3e2626] border-[#3e2626]/20"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Minha Localização
                    </Button>
                    {selectedStore && userLocation && (
                      <Button
                        onClick={toggleRoute}
                        size="sm"
                        variant={showRoute ? 'default' : 'outline'}
                        className={showRoute ? 'bg-[#3e2626] text-white' : 'bg-white hover:bg-gray-100 text-[#3e2626] border-[#3e2626]/20'}
                      >
                        <Route className="h-4 w-4 mr-2" />
                        {showRoute ? 'Ocultar Rota' : 'Mostrar Rota'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  <div
                    ref={mapRef}
                    style={{
                      width: '100%',
                      height: '600px',
                      borderRadius: '0 0 12px 12px',
                      overflow: 'hidden',
                    }}
                  />
                  {isGeocoding && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#3e2626] mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Carregando localizações...</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Lojas */}
            <div className="space-y-4">
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => (
                  <Card
                    key={store.id}
                    className={`border-2 transition-all cursor-pointer ${
                      selectedStore?.id === store.id
                        ? 'border-[#3e2626] shadow-xl'
                        : 'border-[#3e2626]/10 hover:border-[#3e2626]/30 hover:shadow-lg'
                    }`}
                    onClick={() => {
                      setSelectedStore(store);
                      setShowRoute(false);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-[#3e2626] rounded-xl flex items-center justify-center">
                              <Store className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-[#3e2626]">{store.name}</h3>
                                {store.distance !== undefined && (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                    <Gauge className="h-3 w-3 mr-1" />
                                    {store.distance} km
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {store.isActive ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Aberta
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 border-red-200">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Fechada
                                  </Badge>
                                )}
                                {selectedProduct && selectedProductInventory && (
                                  <Badge className="bg-[#3e2626] text-white">
                                    <Package className="h-3 w-3 mr-1" />
                                    {selectedProductInventory.quantity} em estoque
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {store.address}, {store.city} - {store.state}
                              </span>
                            </div>
                            {store.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <a
                                  href={`tel:${store.phone}`}
                                  className="hover:text-[#3e2626]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {store.phone}
                                </a>
                              </div>
                            )}
                            {store.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <a
                                  href={`mailto:${store.email}`}
                                  className="hover:text-[#3e2626]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {store.email}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-2 border-[#3e2626]/10">
                  <CardContent className="p-12 text-center">
                    <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-[#3e2626] mb-2">
                      Nenhuma loja encontrada
                    </h3>
                    <p className="text-gray-600">
                      {selectedProduct || searchTerm
                        ? 'Tente ajustar os filtros para encontrar lojas.'
                        : 'Não há lojas cadastradas no momento.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar com Detalhes */}
          <div className="lg:col-span-1">
            {selectedStore ? (
              <Card className="border-2 border-[#3e2626]/10 shadow-lg sticky top-4">
                <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl">
                  <CardTitle className="text-xl font-bold text-[#3e2626]">
                    Detalhes da Loja
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-[#3e2626] mb-2">
                        {selectedStore.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {selectedStore.isActive ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aberta
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Fechada
                          </Badge>
                        )}
                        {selectedStore.distance !== undefined && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            <Gauge className="h-3 w-3 mr-1" />
                            {selectedStore.distance} km
                          </Badge>
                        )}
                        {selectedProduct && selectedProductInventory && (
                          <Badge className="bg-[#3e2626] text-white">
                            <Package className="h-3 w-3 mr-1" />
                            {selectedProductInventory.quantity} unidades
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-[#3e2626] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[#3e2626]">Endereço</p>
                          <p className="text-gray-600">
                            {selectedStore.address}
                            <br />
                            {selectedStore.city} - {selectedStore.state}
                            <br />
                            CEP: {selectedStore.zipCode}
                          </p>
                        </div>
                      </div>

                      {selectedStore.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-[#3e2626] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#3e2626]">Telefone</p>
                            <a
                              href={`tel:${selectedStore.phone}`}
                              className="text-gray-600 hover:text-[#3e2626]"
                            >
                              {selectedStore.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {selectedStore.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-[#3e2626] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#3e2626]">E-mail</p>
                            <a
                              href={`mailto:${selectedStore.email}`}
                              className="text-gray-600 hover:text-[#3e2626]"
                            >
                              {selectedStore.email}
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-[#3e2626] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[#3e2626]">Horário</p>
                          <p className="text-gray-600">
                            Segunda a Sexta: 8h às 18h
                            <br />
                            Sábado: 9h às 15h
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 space-y-2">
                      <Button
                        className="w-full bg-[#3e2626] hover:bg-[#2a1a1a] text-white"
                        onClick={() => {
                          const address = encodeURIComponent(
                            `${selectedStore.address}, ${selectedStore.city}, ${selectedStore.state}`
                          );
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${address}`,
                            '_blank'
                          );
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Ver no Google Maps
                      </Button>
                      {userLocation && (
                        <Button
                          variant="outline"
                          className="w-full border-[#3e2626]/20 hover:border-[#3e2626] text-[#3e2626]"
                          onClick={toggleRoute}
                        >
                          <Route className="h-4 w-4 mr-2" />
                          {showRoute ? 'Ocultar Rota' : 'Mostrar Rota no Mapa'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-[#3e2626]/10">
                <CardContent className="p-8 text-center">
                  <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Clique em uma loja no mapa ou na lista para ver os detalhes
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
