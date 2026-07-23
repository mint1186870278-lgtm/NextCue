import { MessageCircle, CheckSquare, BarChart3 } from "lucide-react";

interface BottomNavProps {
  activeTab: 'chat' | 'focus' | 'review';
  onTabChange: (tab: 'chat' | 'focus' | 'review') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'focus' ? 'active' : ''}`}
        onClick={() => onTabChange('focus')}
      >
        <div className="icon-container">
          <CheckSquare size={24} strokeWidth={activeTab === 'focus' ? 2.5 : 2} />
          {activeTab === 'focus' && <span className="nav-indicator" />}
        </div>
        <span className="nav-label" style={{ display: 'none' }}>Focus</span>
      </button>

      <div className="nav-item-center-wrapper">
        <button 
            className={`nav-item-center ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => onTabChange('chat')}
        >
            <MessageCircle size={28} color="var(--color-primary-foreground)" strokeWidth={2.5} />
        </button>
      </div>
      
      <button 
        className={`nav-item ${activeTab === 'review' ? 'active' : ''}`}
        onClick={() => onTabChange('review')}
      >
        <div className="icon-container">
          <BarChart3 size={24} strokeWidth={activeTab === 'review' ? 2.5 : 2} />
          {activeTab === 'review' && <span className="nav-indicator" />}
        </div>
        <span className="nav-label" style={{ display: 'none' }}>Review</span>
      </button>
    </nav>
  );
}
