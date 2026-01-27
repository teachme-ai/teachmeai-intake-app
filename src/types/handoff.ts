
export interface HandoffPayload {
    persona_id: string;
    landing_page_id: string;
    quiz_version?: string;
    answers_raw: Array<{
        role: string;
        content: string;
    }>;
    contact_info: {
        name: string;
        email: string;
    };
    attribution?: {
        utm_source?: string;
        referrer?: string;
        campaign?: string;
    };
}

export interface HandoffResponse {
    lead_id: string;
    redirect_url: string;
    status: 'success' | 'error';
    message?: string;
}
