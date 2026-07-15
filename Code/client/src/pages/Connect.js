import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import StorageIcon from '@mui/icons-material/Storage';
import axios from 'axios';
import {
    getRobotIP, getPrinterIP, getBackendURL,
    setRobotIP, setPrinterIP, setBackendURL,
    robotAPIBase, printerURL,
} from '../config';
import { valetudoAPI } from '../mapping/api/client';
import { printerAPI, mobiPrintAPI } from '../mapping/api/mobiprintclient';

const TEST_TIMEOUT_MS = 5000;

// Accept "192.168.1.19", "http://192.168.1.19", "192.168.1.19/" etc.
const normalizeHost = (value) => value.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');

// Backend is a full origin; add http:// if the user left it off.
const normalizeURL = (value) => {
    let url = value.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//.test(url)) {
        url = 'http://' + url;
    }
    return url;
};

function StatusLine({ status }) {
    if (!status) {
        return null;
    }
    const color = status.ok === true ? 'success.main' : status.ok === false ? 'error.main' : 'text.secondary';
    return (
        <Typography variant="body2" color={color} sx={{ mt: 1 }}>
            {status.message}
        </Typography>
    );
}

function DevicePanel({ icon, title, label, value, onChange, onSubmit, status }) {
    return (
        <Box
            sx={{
                margin: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 320,
            }}
        >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                {icon}
            </Avatar>
            <Typography component="h1" variant="h5" align="center">
                {title}
            </Typography>
            <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    label={label}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={status?.ok === null}
                    sx={{ mt: 3, mb: 2 }}
                >
                    Connect
                </Button>
                <StatusLine status={status} />
            </Box>
        </Box>
    );
}

export default function Connect() {
    const [printerHost, setPrinterHost] = React.useState(getPrinterIP());
    const [robotHost, setRobotHost] = React.useState(getRobotIP());
    const [backend, setBackend] = React.useState(getBackendURL());

    const [printerStatus, setPrinterStatus] = React.useState(null);
    const [robotStatus, setRobotStatus] = React.useState(null);
    const [backendStatus, setBackendStatus] = React.useState(null);

    const handleSubmitPrinter = async (event) => {
        event.preventDefault();
        const host = normalizeHost(printerHost);
        setPrinterStatus({ ok: null, message: 'Connecting…' });
        try {
            await axios.get(`http://${host}/rr_status?type=8`, { timeout: TEST_TIMEOUT_MS });
            setPrinterIP(host);
            printerAPI.defaults.baseURL = printerURL();
            setPrinterStatus({ ok: true, message: `Printer responded — saved ${host}` });
        } catch (error) {
            setPrinterStatus({ ok: false, message: `No printer response at ${host}` });
        }
    };

    const handleSubmitRobot = async (event) => {
        event.preventDefault();
        const host = normalizeHost(robotHost);
        setRobotStatus({ ok: null, message: 'Connecting…' });
        try {
            const { data } = await axios.get(`http://${host}/api/v2/robot`, { timeout: TEST_TIMEOUT_MS });
            setRobotIP(host);
            valetudoAPI.defaults.baseURL = robotAPIBase();
            const model = data?.modelName ? ` (${data.modelName})` : '';
            setRobotStatus({ ok: true, message: `Robot responded${model} — saved ${host}` });
        } catch (error) {
            setRobotStatus({ ok: false, message: `No robot response at ${host}` });
        }
    };

    const handleSubmitBackend = async (event) => {
        event.preventDefault();
        const url = normalizeURL(backend);
        setBackendStatus({ ok: null, message: 'Connecting…' });
        try {
            await axios.get(`${url}/test`, { timeout: TEST_TIMEOUT_MS });
            setBackendURL(url);
            mobiPrintAPI.defaults.baseURL = url;
            setBackendStatus({ ok: true, message: `Backend responded — saved ${url}` });
        } catch (error) {
            setBackendStatus({ ok: false, message: `No backend response at ${url}` });
        }
    };

    return (
        <Container component="main" maxWidth="lg">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                <DevicePanel
                    icon={<ViewInArIcon />}
                    title="3D Printer (Duet)"
                    label="Printer IP Address"
                    value={printerHost}
                    onChange={setPrinterHost}
                    onSubmit={handleSubmitPrinter}
                    status={printerStatus}
                />
                <DevicePanel
                    icon={<DonutSmallIcon />}
                    title="Robot (Valetudo)"
                    label="Robot IP Address"
                    value={robotHost}
                    onChange={setRobotHost}
                    onSubmit={handleSubmitRobot}
                    status={robotStatus}
                />
                <DevicePanel
                    icon={<StorageIcon />}
                    title="Backend Server"
                    label="Backend URL"
                    value={backend}
                    onChange={setBackend}
                    onSubmit={handleSubmitBackend}
                    status={backendStatus}
                />
            </Box>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                Addresses are saved in this browser after a successful connection test.
                If a live map view was already open, refresh the page after changing the robot address.
            </Typography>
        </Container>
    );
}
