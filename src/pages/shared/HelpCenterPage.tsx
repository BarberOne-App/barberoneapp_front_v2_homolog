import { useState } from 'react';
import { 
  Search, 
  Book, 
  MessageCircle, 
  FileText, 
  Phone, 
  Mail, 
  ChevronRight,
  Play,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const faqs = [
  {
    question: 'How do I create a new booking?',
    answer: 'To create a new booking, go to the Bookings page and click the "New Booking" button. Fill in the customer details, select the service, staff member, and preferred date/time.',
    category: 'Bookings'
  },
  {
    question: 'How do I add a new staff member?',
    answer: 'Navigate to the Staff page and click "Add Staff". Fill in the required information including name, contact details, and role. The new staff member will receive login credentials via email.',
    category: 'Staff'
  },
  {
    question: 'How do I process a refund?',
    answer: 'Go to the Payments page, find the transaction you want to refund, click on the three dots menu, and select "Process Refund". Enter the refund amount and reason.',
    category: 'Payments'
  },
  {
    question: 'How do I create a promotion?',
    answer: 'Visit the Promotions page and click "Add Promotion". Set the promotion name, discount percentage, valid dates, and generate a unique code for customers to use.',
    category: 'Promotions'
  },
  {
    question: 'How do I view reports?',
    answer: 'Click on "Generate Reports" in the header or navigate to the Overview page. You can filter reports by date range, staff member, or service type.',
    category: 'Reports'
  },
  {
    question: 'How do I manage user permissions?',
    answer: 'Go to Settings > Users & Roles. Select a role and toggle the permissions you want to enable or disable for that role.',
    category: 'Settings'
  },
];

const guides = [
  { title: 'Getting Started Guide', description: 'Learn the basics of using BarberOne', icon: Book, color: 'bg-blue-500/10 text-blue-500' },
  { title: 'Staff Management', description: 'How to manage your team effectively', icon: MessageCircle, color: 'bg-emerald-500/10 text-emerald-500' },
  { title: 'Booking System', description: 'Master the booking workflow', icon: FileText, color: 'bg-purple-500/10 text-purple-500' },
  { title: 'Payment Processing', description: 'Handle payments and refunds', icon: FileText, color: 'bg-amber-500/10 text-amber-500' },
];

const videos = [
  { title: 'Dashboard', duration: '5:30', thumbnail: 'D' },
  { title: 'Creating Your First Booking', duration: '3:45', thumbnail: 'B' },
  { title: 'Managing Staff Schedules', duration: '7:15', thumbnail: 'S' },
  { title: 'Setting Up Promotions', duration: '4:20', thumbnail: 'P' },
];

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-8 border border-primary/20 text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">How can we help you?</h2>
        <p className="text-muted-foreground mb-6">Search our knowledge base or browse categories below</p>
        <div className="max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card text-foreground placeholder:text-muted-foreground rounded-xl pl-12 pr-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Quick Guides */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Quick Guides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {guides.map((guide, idx) => (
            <div 
              key={idx} 
              className="bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-lg ${guide.color} flex items-center justify-center mb-4`}>
                <guide.icon size={24} />
              </div>
              <h4 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                {guide.title}
              </h4>
              <p className="text-xs text-muted-foreground">{guide.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Video Tutorials */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Video Tutorials</h3>
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            View All <ChevronRight size={14} />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {videos.map((video, idx) => (
            <div 
              key={idx} 
              className="bg-card rounded-xl border border-border overflow-hidden group cursor-pointer"
            >
              <div className="aspect-video bg-secondary flex items-center justify-center relative">
                <span className="text-4xl font-bold text-muted-foreground">{video.thumbnail}</span>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Play size={20} className="text-primary-foreground ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
                  {video.duration}
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-foreground">{video.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Frequently Asked Questions</h3>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filteredFaqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="border-b border-border last:border-b-0"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">{faq.category}</Badge>
                  <span className="text-sm font-medium text-foreground">{faq.question}</span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`text-muted-foreground transition-transform ${expandedFaq === idx ? 'rotate-90' : ''}`}
                />
              </button>
              {expandedFaq === idx && (
                <div className="px-4 pb-4 pl-24">
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Still need help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-5 border border-border flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Mail size={24} className="text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Email Support</h4>
              <p className="text-xs text-muted-foreground">support@barberone.com</p>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Phone size={24} className="text-emerald-500" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Phone Support</h4>
              <p className="text-xs text-muted-foreground">(11) 98765-9999</p>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <MessageCircle size={24} className="text-purple-500" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Live Chat</h4>
              <p className="text-xs text-muted-foreground">Available 9AM - 6PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Link */}
      <div className="bg-card rounded-xl p-6 border border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <FileText size={24} className="text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">Full Documentation</h4>
            <p className="text-xs text-muted-foreground">Complete guide to all features and APIs</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          View Docs <ExternalLink size={14} />
        </Button>
      </div>
    </div>
  );
}
