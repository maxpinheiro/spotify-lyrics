import React from 'react';
import spotifyService from "../services/SpotifyService";
import geniusService from "../services/GeniusService";
import {LoadingMessage} from "./Home";
import InfoDisplay from "./InfoDisplay";

const queryString = require('query-string');

class Player extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            status: "loading",
            spotify_access_token: undefined,
            spotify_refresh_token: undefined,
            spotify_expires_in: undefined,
            genius_access_token: undefined,
            song: {
                title: undefined,
                artist: undefined,
                albumArtUrl: undefined,
                lyrics: undefined
            },
            audioFeatures: {
                danceability: undefined,
                energy: undefined,
                key: undefined,
                loudness: undefined,
                mode:  undefined,
                speechiness: undefined,
                acousticness: undefined,
                instrumentalness: undefined,
                liveness: undefined,
                valence: undefined,
                tempo: undefined,
                type: undefined,
                duration_ms: undefined,
                time_signature: undefined
            },
            description: undefined
        };
    }

    componentDidMount() {
        // logic: detect current playback, fetch lyrics for song, display info to page
        // extra: use song features for more specific rendering (background? font? color?)
        const {spotify_access_token, spotify_refresh_token, spotify_expires_in, genius_access_token} = queryString.parse(this.props.location.search);
        //console.log({spotify_access_token, spotify_refresh_token, spotify_expires_in, genius_access_token});
        if (spotify_access_token && genius_access_token) {
            this.findCurrentSong(spotify_access_token, genius_access_token)
        }
    }

    findCurrentSong(spotify_access_token, genius_access_token) {
        spotifyService.getCurrentTrack(spotify_access_token)
            .then(data => {
                if (data.item && data.item.name && data.item.artists && data.item.artists[0].name) {
                    const song = data.item.name;
                    const artist = data.item.artists[0].name;
                    const spotifyId = data.item.id;
                    this.findLyrics(song, artist, spotifyId, genius_access_token, spotify_access_token);
                } else if (data.error) {
                    this.setState({status: "error", message: `There was an error loading the player: ${data.error.message}. Try refreshing the page or redirecting to the home page.`});
                } else {
                    this.setState({status: "error", message: "No track is currently playing. Please play a track and refresh the page for the lyric player to work."});
                }
            }).catch(e => {this.setState({status: "error", message: "The player failed to load for an unknown reason. Please refresh the page, or redirect to the home page to restart the authorization flow."})})
    }

    findLyrics(song, artist, spotifyId, genius_access_token, spotify_access_token) {
        geniusService.getSongArtist(song, artist, genius_access_token)
            .then(songData => {
                if (songData.albumArt) {
                    this.setState(prevState => ({
                        ...prevState,
                        song: {
                            title: song,
                            artist,
                            albumArtUrl: songData.albumArt,
                            lyrics: songData.lyrics
                        }
                    }));
                    this.getSpotifyFeatures(spotifyId, song, artist, spotify_access_token, genius_access_token);
                }
            }).catch(e => {this.setState({status: "error", message: "The player failed to load for an unknown reason. Please refresh the page, or redirect to the home page to restart the authorization flow."})})
    }

    getSpotifyFeatures(spotifyId, song, artist, spotify_access_token, genius_access_token) {
        spotifyService.getAudioFeatures(spotifyId, spotify_access_token)
            .then(data => {
                if (data.danceability) {
                    this.setState(prevState => ({
                        ...prevState,
                        audioFeatures: {
                            danceability: data.danceability,
                            energy: data.energy,
                            key: data.key,
                            loudness: data.loudness,
                            mode:  data.mode,
                            speechiness: data.speechiness,
                            acousticness: data.acousticness,
                            instrumentalness: data.instrumentalness,
                            liveness: data.liveness,
                            valence: data.valence,
                            tempo: data.tempo,
                            type: data.type,
                            duration_ms: data.duration_ms,
                            time_signature: data.time_signature
                        }
                    }));
                    this.getGeniusData(song, artist, genius_access_token);
                }
            }).catch(e => {this.setState({status: "error", message: "The player failed to load for an unknown reason. Please refresh the page, or redirect to the home page to restart the authorization flow."})})
    }

    getGeniusData(song, artist, genius_access_code) {
        geniusService.searchSong(song, artist, genius_access_code)
            .then(res => {
                if (res.response && res.response.hits) {
                    const songData = res.response.hits.find(d => d.result.title.toLowerCase().includes(song.toLowerCase()));
                    if (!songData) return;
                    const songId = songData.result.id;
                    geniusService.getSongDetails(songId, genius_access_code)
                        .then(data => {
                            console.log(data);
                            if (data.response && data.response.song) {
                                this.setState(prevState => ({
                                    ...prevState,
                                    status: "success",
                                    description: data.response.song.description.html
                                }));
                            }
                        }).catch(e => {this.setState({status: "error", message: "The player failed to load for an unknown reason. Please refresh the page, or redirect to the home page to restart the authorization flow."})})
                }
            }).catch(e => {this.setState({status: "error", message: "The player failed to load for an unknown reason. Please refresh the page, or redirect to the home page to restart the authorization flow."})})
    }

    render() {
        return (
            <div className="container mx-auto text-center my-3">
                {
                    this.state.status === "loading" && <div><div style={{height: "30vh"}}/>{LoadingMessage("Retrieving song info...")}</div>
                }
                {
                    this.state.status === "success" && this.state.song.title &&
                    <InfoDisplay title={this.state.song.title} artist={this.state.song.artist} albumArtUrl={this.state.song.albumArtUrl} lyrics={this.state.song.lyrics} audioFeatures={this.state.audioFeatures} description={this.state.description}/>
                }
                {
                    this.state.status === "error" &&
                    <div>
                        <div style={{height: "30vh"}} />
                        <p>{this.state.message}</p>
                    </div>
                }

            </div>
        )
    }
}

export default Player;
