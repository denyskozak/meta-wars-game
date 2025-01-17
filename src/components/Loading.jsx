import {CircularProgress} from "@mui/material";
import './Loading.css';

export const Loading = () => (
    <div className="loading-container">
            <span>Loading Models</span>
            <CircularProgress color="info" />
    </div>
)