import axios from 'axios';
export const testBackendConnection = async () => {
    try {
        const response = await axios.get('http://127.0.0.1:8000/health');
        console.log('Backend connection successful:', response.data);
        return true;
    } catch (error) {
        console.error('Backend connection failed:', error);
        return false;
    }
}; 