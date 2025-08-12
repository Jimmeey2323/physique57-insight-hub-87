
import { useState, useEffect } from 'react';
import { SalesData } from '@/types/dashboard';

const GOOGLE_CONFIG = {
  CLIENT_ID: "416630995185-007ermh3iidknbbtdmu5vct207mdlbaa.apps.googleusercontent.com",
  CLIENT_SECRET: "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",
  REFRESH_TOKEN: "1//04pAfj5ZB3ahLCgYIARAAGAQSNwF-L9IrqCo4OyUjAbO1hP5bR3vhs8K96zDZkbeCzcuCjzEiBPZ3O639cLRkUduicMYK1Rzs5GY",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = "149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI";

// Safe date parser for DD/MM/YYYY format
const parseSalesDate = (dateString: string): string => {
  if (!dateString || dateString.trim() === '') return '';
  
  try {
    // Handle DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      
      // Create date in YYYY-MM-DD format for consistent parsing
      const isoDate = `${year}-${month}-${day}`;
      const testDate = new Date(isoDate);
      
      if (!isNaN(testDate.getTime())) {
        return isoDate;
      }
    }
    
    // Fallback: try parsing as-is
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate.toISOString().split('T')[0];
    }
    
    return '';
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return '';
  }
};

export const useGoogleSheets = () => {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAccessToken = async () => {
    try {
      const response = await fetch(GOOGLE_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
          refresh_token: GOOGLE_CONFIG.REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const tokenData = await response.json();
      return tokenData.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accessToken = await getAccessToken();
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sales?alt=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();
      const rows = result.values || [];
      
      if (rows.length < 2) {
        console.warn('No data rows found in Sales sheet');
        setData([]);
        return;
      }

      // Map according to the provided sheet structure
      const salesData: SalesData[] = rows.slice(1).map((row: any[]) => {
        const paymentValue = parseFloat(row[6]) || 0;
        const paymentVAT = parseFloat(row[8]) || 0;
        const mrpPreTax = parseFloat(row[20]) || 0;
        const mrpPostTax = parseFloat(row[21]) || 0;
        const discountAmount = parseFloat(row[22]) || 0;
        
        // Calculate net revenue (payment value minus VAT)
        const netRevenue = paymentValue - paymentVAT;
        
        return {
          memberId: row[0] || '',
          customerName: row[1] || '',
          customerEmail: row[2] || '',
          saleItemId: row[3] || '',
          paymentCategory: row[4] || '',
          paymentDate: parseSalesDate(row[5]) || '',
          paymentValue: paymentValue,
          paidInMoneyCredits: parseFloat(row[7]) || 0,
          paymentVAT: paymentVAT,
          paymentItem: row[9] || '',
          paymentStatus: row[11] || '',
          paymentMethod: row[10] || '',
          paymentTransactionId: row[12] || '',
          stripeToken: row[13] || '',
          soldBy: row[14] || 'Unknown',
          saleReference: row[15] || '',
          calculatedLocation: row[16] || '',
          cleanedProduct: row[17] || '',
          cleanedCategory: row[18] || '',
          
          // Additional derived fields
          netRevenue: netRevenue,
          vat: paymentVAT,
          grossRevenue: paymentValue,
          mrpPreTax: mrpPreTax,
          mrpPostTax: mrpPostTax,
          discountAmount: discountAmount,
          discountPercentage: parseFloat(row[23]) || 0,
          membershipType: row[24] || '',
          hostId: row[19] || ''
        };
      }).filter(item => item.paymentDate !== ''); // Filter out invalid dates

      console.log('Successfully parsed sales data:', salesData.length, 'records');
      console.log('Sample record:', salesData[0]);
      
      setData(salesData);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  return { data, loading, error, refetch: fetchSalesData };
};
