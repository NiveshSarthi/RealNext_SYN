import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { catalogAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  BanknotesIcon,
  FunnelIcon,
  CheckBadgeIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const PropertyCard = ({ property, onEdit, onDelete }) => {
  return (
    <div className="card group hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image / Header Area */}
      <div className="relative h-48 bg-muted/20 w-full overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1117] to-transparent opacity-80 z-10" />

        {property.images?.[0] || property.imageUrl ? (
          <img
            src={property.images?.[0] || property.imageUrl}
            alt={property.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800/50">
            <BuildingOfficeIcon className="h-20 w-20 text-gray-600" />
          </div>
        )}
        <div className="absolute bottom-4 left-4 z-20">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary text-black mb-2 inline-block">
            {property.category}
          </span>
          <h3 className="text-lg font-semibold text-white leading-tight">{property.name}</h3>
          <div className="flex items-center text-gray-300 text-xs mt-1">
            <MapPinIcon className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[200px]">{property.description || 'No location info'}</span>
          </div>
        </div>

        {/* Actions (Edit/Delete) - Visible on hover or always if simple */}
        <div className="absolute top-2 right-2 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(property)}
            className="p-1.5 bg-black/50 hover:bg-primary text-white rounded-full backdrop-blur-sm transition-colors"
            title="Edit Property"
          >
            <PencilIcon className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(property.id)}
            className="p-1.5 bg-black/50 hover:bg-destructive text-white rounded-full backdrop-blur-sm transition-colors"
            title="Delete Property"
          >
            <TrashIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{property.properties?.bhk || '-'} BHK</span>
          </div>
          <div className="flex items-center gap-2">
            <BanknotesIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {property.currency} {property.price ? Number(property.price).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 flex items-center justify-center rounded-full border border-muted-foreground/30 text-[9px] text-muted-foreground">sq</div>
            <span className="text-sm font-medium text-foreground">{property.properties?.area || '-'} sqft</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckBadgeIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-foreground capitalize">{property.status}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between gap-3 mt-auto">
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const initialForm = {
    name: '',
    category: 'Apartment',
    price: '',
    currency: 'INR',
    description: '', // Used for location/short desc
    bhk: '',
    area: '',
    imageUrl: ''
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await catalogAPI.getItems();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      toast.error('Failed to load properties');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category || 'Apartment',
      price: item.price || '',
      currency: item.currency || 'INR',
      description: item.description || '',
      bhk: item.properties?.bhk || '',
      area: item.properties?.area || '',
      imageUrl: item.images?.[0] || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { data } = await catalogAPI.deleteItem(id);
      if (data.success) {
        toast.success('Property deleted');
        fetchItems();
      }
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const handleSubmit = async () => {
    try {
      // Basic Validation
      if (!formData.name) return toast.error('Property Name is required');

      const payload = {
        name: formData.name,
        category: formData.category,
        price: formData.price ? parseFloat(formData.price) : null,
        currency: formData.currency,
        description: formData.description,
        // Store extra details in properties JSONB to match schema
        properties: {
          bhk: formData.bhk,
          area: formData.area
        },
        // Store single image in images array
        images: formData.imageUrl ? [formData.imageUrl] : []
      };

      if (editingItem) {
        await catalogAPI.updateItem(editingItem.id, payload);
        toast.success('Property updated successfully');
      } else {
        await catalogAPI.createItem(payload);
        toast.success('Property added successfully');
      }

      setIsModalOpen(false);
      fetchItems();

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save property');
    }
  };

  const [activeFilter, setActiveFilter] = useState('All');

  // Filter items
  const filteredItems = items.filter(item => {
    // 1. Search Term Filter
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Category/Tag Filter
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Premium') return (item.price && item.price >= 50000000); // > 5 Cr
    if (activeFilter === 'Villa') return item.category === 'Villa';
    if (activeFilter === 'Under 2Cr') return (item.price && item.price < 20000000);
    if (activeFilter === 'Ready to move') return item.status === 'Ready to move';
    if (activeFilter === 'RERA Approved') return item.rera || false; // Placeholder

    return true;
  });

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary w-64"
              />
            </div>
            <Button variant="primary" onClick={openCreateModal}>
              <PlusIcon className="h-5 w-5 mr-2" /> Add Property
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Premium', 'Villa', 'Under 2Cr', 'Ready to move', 'RERA Approved'].map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${activeFilter === tag
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-card border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading properties...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-500 py-20 bg-card/30 rounded-xl border border-dashed border-border">
            <div className="mb-4 text-6xl">🏢</div>
            <h3 className="text-xl font-medium text-white mb-2">No properties found</h3>
            <p className="mb-6">Get started by adding your first property to the catalog.</p>
            <Button variant="primary" onClick={openCreateModal}>
              Add Property
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Property' : 'Add New Property'}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Input
                  label="Property Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Sunrise Apartments"
                />
              </div>

              <div className="col-span-2">
                <Input
                  label="Location / Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Whitefield, Bangalore"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                <Select value={formData.category} onValueChange={(val) => handleSelectChange('category', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Plot">Plot</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g. 15000000"
                />
              </div>

              <div>
                <Input
                  label="BHK Configuration"
                  name="bhk"
                  value={formData.bhk}
                  onChange={handleInputChange}
                  placeholder="e.g. 3"
                />
              </div>

              <div>
                <Input
                  label="Area (sqft)"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  placeholder="e.g. 1850"
                />
              </div>

              <div className="col-span-2">
                <Input
                  label="Image URL"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingItem ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}