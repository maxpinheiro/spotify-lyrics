import React from 'react';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";
import {getAuthTokens} from '../services/SpotifyService';
import { Link } from 'react-router-dom';

const queryString = require('query-string');


class Callback extends React.Component {

    constructor(props) {
        super(props);
        this.state = {status: "loading", access_token: undefined, refresh_token: undefined, expires_in: undefined};
    }

    componentDidMount() {
        const {code, error, state} = queryString.parse(this.props.location.search);
        //console.log({code, error, state});
        if (code) this.getTokens(code);
    }

    getTokens(code) {
        //console.log('callback: get tokens')
        getAuthTokens(code).then(data => {
            console.log(data);
            if (data.error) {
                this.setState({status: "error", message: data.error_description});
            } else if (data.access_token) {
                this.setState({status: "success", access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in});
            }  
        }).catch(e => {
            this.setState({status: "error"});
        });
    }

    render() {
        return (
            <div>
                <p>Logging you in...</p>
                { this.state.status === "loading" &&
                <Loader type="Oval" color="#15d61c" height={80} width={80}/>
                }
                { this.state.status === "success" &&
                <Link to={`/player?access_token=${this.state.access_token}&refresh_token=${this.state.refresh_token}&expires_in=${this.state.expires_in}`}>Continue to Player</Link>
                }
                { this.state.status === "error" &&
                    <span>
                        <p>There was an issue logging in{this.state.message && `: ${this.state.message}`}. Please login again through the </p>
                        <Link to="/">Home page</Link>.
                    </span>
                }
            </div>
        );
    }
}

export default Callback;