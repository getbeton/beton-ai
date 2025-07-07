export interface FindymailContact {
  id: number;
  name: string;
  email: string;
  domain: string;
  company: string;
  linkedin_url: string | null;
  job_title: string | null;
  company_city: string;
  company_region: string;
  company_country: string;
  city: string | null;
  region: string | null;
  country: string | null;
  phone_number: string | null;
}

export interface FindymailSearchResponse {
  success: boolean;
  data: {
    contact: FindymailContact;
  };
}

export interface FindymailErrorResponse {
  success: false;
  error: string;
} 