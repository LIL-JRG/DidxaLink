import { create } from 'zustand';

export interface Contribution {
  id: number;
  name: string;
  email: string;
  community?: string;
  spanish: string;
  zapotec: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

interface ContributionState {
  contributions: Contribution[];
  addContribution: (contribution: Omit<Contribution, 'id' | 'status' | 'date'>) => void;
  updateStatus: (id: number, status: Contribution['status']) => void;
  getContributions: () => Contribution[];
  getFilteredContributions: (status?: Contribution['status'], searchTerm?: string) => Contribution[];
  getContributionById: (id: number) => Contribution | undefined;
}

// Initialize store with data from localStorage if available
const useContributionStore = create<ContributionState>((set, get) => ({
  contributions: typeof localStorage !== 'undefined' 
    ? JSON.parse(localStorage.getItem('contributions') || '[]') 
    : [],
  
  addContribution: (contribution) => set((state) => {
    const newContribution: Contribution = {
      ...contribution,
      id: Date.now(),
      status: 'pending',
      date: new Date().toISOString()
    };
    
    const updatedContributions = [...state.contributions, newContribution];
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('contributions', JSON.stringify(updatedContributions));
    }
    
    return { contributions: updatedContributions };
  }),
  
  updateStatus: (id, status) => set((state) => {
    const updatedContributions = state.contributions.map(contribution => 
      contribution.id === id ? { ...contribution, status } : contribution
    );
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('contributions', JSON.stringify(updatedContributions));
    }
    
    return { contributions: updatedContributions };
  }),
  
  getContributions: () => get().contributions,
  
  getFilteredContributions: (status, searchTerm) => {
    const { contributions } = get();
    
    return contributions.filter(contribution => {
      // Filter by status
      if (status && contribution.status !== status) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchFields = [
          contribution.name,
          contribution.email,
          contribution.community,
          contribution.spanish,
          contribution.zapotec,
          contribution.notes
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        return searchFields.some(field => field?.includes(searchTerm.toLowerCase()));
      }
      
      return true;
    });
  },
  
  getContributionById: (id) => {
    return get().contributions.find(contribution => contribution.id === id);
  }
}));

export default useContributionStore;