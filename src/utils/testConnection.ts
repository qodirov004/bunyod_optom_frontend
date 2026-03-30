import axios from 'axios';
export const testBackendConnection = async () => {
    try {
        const response = await axios.get('logistika.api.ardentsoft.uzhealth');
        console.log('Backend connection successful:', response.data);
        return true;
    } catch (error) {
        console.error('Backend connection failed:', error);
        return false;
    }
}; 