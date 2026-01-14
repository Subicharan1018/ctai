// API Response Types
export interface MaterialRequirement {
    material: string;
    quantity: number | string;
    unit: string;
    unit_cost: number | string;
    total_cost: number;
    cost_in_lakhs: number;
    priority?: string;
    reason?: string;
    vendor_count?: number;
}

export interface BudgetBreakdown {
    material_cost: number;
    labor_cost: number;
    equipment_cost: number;
    overhead: number;
    contractor_profit: number;
    total_cost: number;
    cost_per_sqft: number;
    total_cost_in_crores: number;
    breakdown_percentage: {
        materials: number;
        labor: number;
        equipment: number;
        overhead: number;
        profit: number;
    };
}

export interface Vendor {
    product: string;
    vendor: string;
    location: string;
    gst: string;
    rating: string;
    url: string;
    availability: string;
    relevance_score: number;
}

export interface ProjectDetails {
    built_area_sqft: number;
    location: string;
    project_type: string;
    power_capacity_mw?: number | null;
    project_volume_cr?: number | null;
}

export interface SchedulePhase {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    duration: number;
    progress: number;
    color: string;
    dependencies: string[];
}

export interface ProjectSchedule {
    phases: SchedulePhase[];
    total_duration: number;
    total_months: number;
    start_date: string;
    end_date: string;
}

export interface ProcurementReport {
    project_details: ProjectDetails;
    ai_analysis?: string;
    material_requirements: MaterialRequirement[];
    budget_breakdown: BudgetBreakdown;
    vendor_recommendations: Record<string, Vendor[]>;
    schedule: ProjectSchedule;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    data?: ProcurementReport;
}
