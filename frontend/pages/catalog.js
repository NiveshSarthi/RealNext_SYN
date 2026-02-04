import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  BanknotesIcon,
  FunnelIcon,
  CheckBadgeIcon,
  CalendarIcon,
  StarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const PropertyCard = ({ property }) => {
  return (
    <div className="card group hover:border-primary/50 transition-all duration-300 overflow-hidden">
      {/* Image / Header Area */}
      <div className="relative h-48 bg-muted/20 w-full overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1117] to-transparent opacity-80 z-10" />
        <img
          src={property.imageUrl || "https://via.placeholder.com/400x300/161B22/FFFFFF?text=Property"}
          alt={property.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
        />
        <div className="absolute bottom-4 left-4 z-20">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary text-black mb-2 inline-block">
            {property.type}
          </span>
          <h3 className="text-lg font-semibold text-white leading-tight">{property.title}</h3>
          <div className="flex items-center text-gray-300 text-xs mt-1">
            <MapPinIcon className="h-3 w-3 mr-1" />
            {property.location}
          </div>
        </div>

        {/* Match Score */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
          <div className="relative h-10 w-10 flex items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90 text-gray-700" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F97316" strokeWidth="4" strokeDasharray={`${property.matchScore}, 100`} />
            </svg>
            <span className="text-[10px] font-semibold text-white">{property.matchScore}%</span>
          </div>
          <span className="text-[9px] text-gray-400 mt-1">Match</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{property.specs.bhk} BHK</span>
          </div>
          <div className="flex items-center gap-2">
            <BanknotesIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">₹ {property.price}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 flex items-center justify-center rounded-full border border-muted-foreground/30 text-[9px] text-muted-foreground">sq</div>
            <span className="text-sm font-medium text-foreground">{property.specs.area} sqft</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckBadgeIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-foreground">RERA</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" className="flex-1 text-xs font-medium">
            <CalendarIcon className="h-4 w-4 mr-2" /> Visited
          </Button>
          <Button variant="primary" size="sm" className="flex-1 text-xs font-semibold">
            Share Pitch
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Catalog() {
  const [viewMode, setViewMode] = useState('grid');

  // Mock Data
  const properties = [
    {
      id: 1,
      title: 'Skyline Avenue',
      location: 'Whitefield, Bangalore',
      type: 'Premium',
      price: '2.4 Cr',
      matchScore: 94,
      imageUrl: null,
      specs: { bhk: 3, area: 1850 }
    },
    {
      id: 2,
      title: 'Green Valley Villas',
      location: 'Sarjapur Roard, Bangalore',
      type: 'Villa',
      price: '4.5 Cr',
      matchScore: 88,
      imageUrl: null,
      specs: { bhk: 4, area: 3200 }
    },
    {
      id: 3,
      title: 'Urban Heights',
      location: 'Indiranagar, Bangalore',
      type: 'Luxury',
      price: '3.1 Cr',
      matchScore: 76,
      imageUrl: null,
      specs: { bhk: 2, area: 1400 }
    },
    {
      id: 4,
      title: 'Lakeside Residency',
      location: 'Hebbal, Bangalore',
      type: 'Apartment',
      price: '1.2 Cr',
      matchScore: 65,
      imageUrl: null,
      specs: { bhk: 2, area: 1100 }
    }
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in container-custom py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Property catalog</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Master inventory with AI-powered matching scores.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter properties..."
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary w-64"
              />
            </div>
            <Button variant="primary">
              <PlusIcon className="h-5 w-5 mr-2" /> Add Property
            </Button>
          </div>
        </div>

        {/* Filters (Visual Mockup) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Premium', 'Villa', 'Under 2Cr', 'Ready to move', 'RERA Approved'].map((tag, i) => (
            <button
              key={tag}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${i === 0 ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:border-muted-foreground'}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </Layout>
  );
}