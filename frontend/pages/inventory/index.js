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
  TrashIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const PropertyCard = ({ property, onEdit, onDelete, onVisit, onView, onShareWhatsApp }) => {
  const handleShare = () => {
    onShareWhatsApp(property);
  };

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

        {/* Actions (View/Edit/Delete) - Visible on hover or always if simple */}
        <div className="absolute top-2 right-2 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(property)}
            className="p-1.5 bg-black/50 hover:bg-blue-500 text-white rounded-full backdrop-blur-sm transition-colors"
            title="View Property Details"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
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
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs font-medium"
            onClick={() => onVisit(property)}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Visited {property.properties?.visitCount > 0 ? `(${property.properties.visitCount})` : ''}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1 text-xs font-semibold"
            onClick={handleShare}
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
            WhatsApp
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

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

  const openViewModal = (item) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const shareOnWhatsApp = (property) => {
    const priceFormatted = property.price
      ? `${property.currency || 'INR'} ${Number(property.price).toLocaleString('en-IN')}`
      : 'Price on Request';

    const categoryEmoji = {
      'Apartment': '🏢',
      'Villa': '🏡',
      'Plot': '🏗️',
      'Commercial': '🏬'
    };

    const statusEmoji = {
      'active': '✅',
      'sold': '🏷️',
      'draft': '📝',
      'inactive': '⏸️'
    };

    let message = `🏠 *${property.name}*

${categoryEmoji[property.category] || '🏠'} *Type:* ${property.category || 'Property'}
📍 *Location:* ${property.description || 'Prime Location'}

💰 *Price:* ${priceFormatted}`;

    // Add property-specific details
    if (property.category === 'Commercial') {
      message += `
🏬 *Commercial Space*
📐 *Area:* ${property.properties?.area ? `${property.properties.area} sqft` : 'N/A'}`;
    } else if (property.category === 'Plot') {
      message += `
🏗️ *Plot/Land*
📐 *Area:* ${property.properties?.area ? `${property.properties.area} sqft` : 'N/A'}`;
    } else {
      message += `
🏢 *Configuration:* ${property.properties?.bhk ? `${property.properties.bhk} BHK` : 'N/A'}
📐 *Area:* ${property.properties?.area ? `${property.properties.area} sqft` : 'N/A'}`;
    }

    message += `
${statusEmoji[property.status] || '📊'} *Status:* ${property.status || 'Available'}

━━━━━━━━━━━━━━━━━━━━━

🌟 *Key Features:*`;

    // Add custom properties if available
    if (property.properties) {
      const features = [];
      Object.entries(property.properties).forEach(([key, value]) => {
        if (!['bhk', 'area', 'visitCount'].includes(key) && value) {
          features.push(`• ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`);
        }
      });
      if (features.length > 0) {
        message += '\n' + features.slice(0, 5).join('\n');
      }
    }

    // Add images
    if (property.images && property.images.length > 0) {
      message += `\n\n🖼️ *Property Images:*`;
      property.images.slice(0, 3).forEach((image, index) => {
        message += `\n📎 Image ${index + 1}: ${image}`;
      });
      if (property.images.length > 3) {
        message += `\n... and ${property.images.length - 3} more images`;
      }
    }

    message += `

━━━━━━━━━━━━━━━━━━━━━
🏢 *RealNext Property Catalog*
📞 Contact us for site visit & details!

#RealEstate #Property #${property.category || 'RealEstate'}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp with enhanced property details');
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

  const handleVisit = async (property) => {
    try {
      const currentProps = property.properties || {};
      const newCount = (currentProps.visitCount || 0) + 1;

      // Optimistic update
      setItems(prev => prev.map(p =>
        p.id === property.id
          ? { ...p, properties: { ...p.properties, visitCount: newCount } }
          : p
      ));

      // Call API to persist
      // We need to send the full payload or partial depending on API. 
      // Assuming updateItem merges or replaces. Based on handle submit, it sends full payload usually.
      // But let's try sending just the properties update if the backend supports partial updates via PATCH/PUT logic,
      // or we construct the full payload from the item.
      // Safer to construct a payload similar to handleSubmit but with existing data.

      const payload = {
        name: property.name,
        category: property.category,
        price: property.price,
        currency: property.currency,
        description: property.description,
        properties: {
          ...currentProps,
          visitCount: newCount
        },
        images: property.images
      };

      await catalogAPI.updateItem(property.id, payload);

    } catch (error) {
      console.error(error);
      toast.error('Failed to update visit count');
      fetchItems(); // Revert on error
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

  const handleDownloadTemplate = async () => {
    try {
      await catalogAPI.downloadTemplate();
      toast.success('Template opened in new tab');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleCsvImport = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please select a valid CSV file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const { data } = await catalogAPI.bulkImport(formData);

      setImportResults(data.data);
      toast.success(data.message);

      // Refresh the list if any items were imported
      if (data.data.success > 0) {
        fetchItems();
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
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
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" /> Download Template
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" /> Import CSV
            </Button>
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
                onVisit={handleVisit}
                onView={openViewModal}
                onShareWhatsApp={shareOnWhatsApp}
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

        {/* CSV Import Modal */}
        <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import Properties from CSV</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Upload a CSV file to bulk import properties. Make sure your CSV follows the template format.
              </div>

              {!importResults && (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleCsvImport(file);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    disabled={importing}
                  />

                  {importing && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Processing CSV file...</span>
                    </div>
                  )}
                </div>
              )}

              {importResults && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckBadgeIcon className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Import Complete</span>
                    </div>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Successfully imported: <strong>{importResults.success}</strong> properties</p>
                      <p>Total rows processed: <strong>{importResults.total}</strong></p>
                      {importResults.errors.length > 0 && (
                        <p className="text-red-600">Errors: <strong>{importResults.errors.length}</strong></p>
                      )}
                    </div>
                  </div>

                  {importResults.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <div className="flex items-center space-x-2 mb-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Import Errors</span>
                      </div>
                      <div className="space-y-1">
                        {importResults.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-xs text-red-700">
                            <strong>Row {error.row}:</strong> {error.error}
                          </div>
                        ))}
                        {importResults.errors.length > 5 && (
                          <div className="text-xs text-red-700 font-medium">
                            ... and {importResults.errors.length - 5} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResults(null);
                }}
              >
                {importResults ? 'Close' : 'Cancel'}
              </Button>
              {importResults && (
                <Button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportResults(null);
                  }}
                >
                  Done
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Property Details Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <EyeIcon className="h-6 w-6" />
                Property Details
              </DialogTitle>
            </DialogHeader>

            {viewingItem && (
              <div className="space-y-6 py-4">
                {/* Image Gallery */}
                {viewingItem.images && viewingItem.images.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {viewingItem.images.map((image, index) => (
                        <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`${viewingItem.name} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA5LjkgMTlIMTQuMUMxNS4xIDE5IDE2IDE4LjEgMTYgMTdWNFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTggOFYxMEgxMFY4SDhaIiBmaWxsPSIjOUNBNEFGIi8+CjxwYXRoIGQ9Ik0xMiAxNkgxNFYxOEgxMloiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTggMTJIMTBWMTQ4OCIgZmlsbD0iIzlDQTQ5RiIvPgo8L3N2Zz4=';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Property Name</label>
                        <p className="text-foreground font-medium">{viewingItem.name}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Category</label>
                        <p className="text-foreground">{viewingItem.category || 'Not specified'}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          viewingItem.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : viewingItem.status === 'sold'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {viewingItem.status || 'draft'}
                        </span>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-foreground">{viewingItem.description || 'No description available'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Pricing & Specifications</h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Price</label>
                        <p className="text-foreground font-medium">
                          {viewingItem.price
                            ? `${viewingItem.currency || 'INR'} ${Number(viewingItem.price).toLocaleString()}`
                            : 'Price not set'
                          }
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">BHK</label>
                          <p className="text-foreground">{viewingItem.properties?.bhk || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Area</label>
                          <p className="text-foreground">{viewingItem.properties?.area ? `${viewingItem.properties.area} sqft` : 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Visit Count</label>
                        <p className="text-foreground">{viewingItem.properties?.visitCount || 0} visits</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">WhatsApp Catalog ID</label>
                        <p className="text-foreground font-mono text-sm">
                          {viewingItem.wa_catalog_id || 'Not synced'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created By</label>
                        <p className="text-foreground">{viewingItem.created_by || 'System'}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created At</label>
                        <p className="text-foreground">
                          {viewingItem.created_at ? new Date(viewingItem.created_at).toLocaleString() : 'Unknown'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                        <p className="text-foreground">
                          {viewingItem.updated_at ? new Date(viewingItem.updated_at).toLocaleString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Properties */}
                {viewingItem.properties && Object.keys(viewingItem.properties).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Custom Properties</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(viewingItem.properties)
                        .filter(([key]) => !['bhk', 'area', 'visitCount'].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="bg-muted/50 rounded-lg p-3">
                            <label className="text-sm font-medium text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <p className="text-foreground font-medium">{String(value)}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {viewingItem.metadata && Object.keys(viewingItem.metadata).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Metadata</h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {JSON.stringify(viewingItem.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => shareOnWhatsApp(viewingItem)}
                  className="flex-1 sm:flex-none"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  Share on WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                  className="flex-1 sm:flex-none"
                >
                  Close
                </Button>
              </div>
              {viewingItem && (
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(viewingItem);
                  }}
                  className="w-full sm:w-auto"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Property
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}