import {useState,  useRef} from 'react';
import {Text, View, StyleSheet, Pressable, TextInput, Modal, Image, ScrollView} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {emsStations} from "./emsStations.js";
import * as Location from 'expo-location';
import {Camera} from 'expo-camera';
export default function App() {
  //list of all markers
  const [markers, setMarkers] = useState([]);
  //inputs from user
  const [inputLatitude, setInputLatitude] = useState();
  const [inputLongitude, setInputLongitude] = useState();
  const [inputName, setInputName] = useState("");
  const [inputDescription, setInputDescription] = useState("");
  //geolocation from user and button text prompt 
  const [geolocation, setGeolocation] = useState({gLocation: null, prompt:"Geolocation"});
  //EMS button prompt state
  const [emsPrompt, setEmsPrompt] = useState("EMS Stations");
  //camera
  const cameraRef = useRef();
  //used to set view to show camera 
  const [showCamera, setShowCamera] = useState(false);
  //used to set Modal picture
  const [picToShow, setPicToShow] = useState(null);
  //used to set pic Modal state
  const [modalPicVisible, setModalPicVisible] = useState(false);
  //modal used for alerts 
  const [modalAlert, setModalAlert] = useState({showState: false, textVal: null});
  //add marker to list of markers
  function putMarkerOnMap(latitude, longitude, title, description, pinType, pinColor, picture=null)
  {
    let new_markers = markers.slice();
    new_markers.push({
      latitude: latitude,
      longitude: longitude,
      title: title,
      description: description,
      pinType: pinType,
      color: pinColor,
      picture: picture
    });
    setMarkers(new_markers);
  }
  //get/set/remove user location
  async function putGeolocation() {
    if (geolocation.prompt == "Geolocation") {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status != 'granted') return;
    let location = await Location.getCurrentPositionAsync({});
    setGeolocation({gLocation: location, prompt: "Remove Geolocation"});
    putMarkerOnMap(location.coords.latitude, location.coords.longitude, "Current Location", "Your Current Location", "userLocation", "green", null);
    } 
    //if user location already on screen - remove user location
    else {
      new_markers = markers.filter((item) => item.pinType !== "userLocation");
      setMarkers(new_markers);
      setGeolocation({gLocation: null, prompt: "Geolocation"});
    }
  }
  //set/remove EMS locations
  function putEMSonMap() {
    if (emsPrompt == "EMS Stations") {
      let new_markers = markers.slice();
      for (let i = 0; i < emsStations.features.length; i++) {
        new_markers.push( {
          latitude: emsStations.features[i].geometry.coordinates[1],
          longitude: emsStations.features[i].geometry.coordinates[0],
          title: emsStations.features[i].properties.STATION_NAME,
          description: emsStations.features[i].properties.ADDRESS,
          pinType: "ems",
          color: "#00a7e1"});
      setEmsPrompt("Remove EMS Locations");
    }
    setMarkers(new_markers);
    }  
    //removee EMS location markers
    else {
      new_markers = markers.filter((item) => item.pinType !== "ems");
      setMarkers(new_markers);
      setEmsPrompt("EMS Stations");
    }}

  function removeAllMarkers() {
    setGeolocation({gLocation: null, prompt: "Geolocation"});
    setEmsPrompt("EMS Stations");
    setMarkers([]);
    setModalAlert({showState: true, textVal: "Markers Removed"});
  }
  //take picture and set new incident
  const takePic = async () => {
   
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true, skipProcessing: true };
      const data = await cameraRef.current.takePictureAsync(options);
      const source = data.uri;
      if (source) {
        await cameraRef.current.pausePreview();
        setShowCamera(false);
        //calls function that adds marker to list of markers
       putMarkerOnMap(parseFloat(inputLatitude), parseFloat(inputLongitude), inputName, inputDescription, "userReport", "red", source);
      }}

      setInputLatitude();
      setInputLongitude();
      setInputDescription("");
      setInputName("");
      setModalAlert({showState: true, textVal: "Thanks for Reporting an Incident"});
      
    };
  //when users inputs incident details, change view to camera
  function putUserReport() {
    //check if valid inputs
    if (inputDescription.trim() == "" ||inputName.trim() == "" || Number.isNaN(parseFloat(inputLongitude)) ||Number.isNaN(parseFloat(inputLatitude)) || parseFloat(inputLongitude) >180 || parseFloat(inputLongitude) < -180 || parseFloat(inputLatitude) >90|| parseFloat(inputLatitude) < -90)  
     {
      setModalAlert({showState: true, textVal: "Invalid Input, No Pin Placed"});
    }
    else {
  setShowCamera(true);
    }
   
  }
  //show modal if user report ie. has picture 
  //set the modal picture based of the clicked markers coords
  function modalPic(marker) {
    if (marker.pinType == "userReport") {
    setModalPicVisible(true);
    let new_markers = markers.slice();
    new_markers = markers.filter((item) => item === marker);
    setPicToShow(new_markers[0].picture);
    }}
  return (
    <ScrollView>
    <View  style={showCamera == true ? {display: 'none'}: {display: 'flex'}}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalPicVisible}
        onRequestClose={() => {
        setModalPicVisible(!modalPicVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
          <Text style={styles.titleTxt}>Picture of Incident:</Text>
          <Image style={{width: 200, height: 200}} source={{uri: picToShow}} />
            <Pressable
              style={styles.bEnabled}
              onPress={() => setModalPicVisible(!modalPicVisible)}>
              <Text
              accessible={true}
              accessibilityLabel= "Hide Picture Modal"
              accessibilityHint="This is the button that close the picture modal">Hide Picture</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalAlert.showState}
        onRequestClose={() => {
        setModalAlert({showState: false, textVal: null});
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
          <Text>{modalAlert.textVal}</Text>
            <Pressable
              style={styles.bEnabled}
              onPress={() => setModalAlert({showState: false, textVal: null})}>
              <Text
               accessible={true}
              accessibilityLabel= "Hide Modal"
              accessibilityHint="This is the button that close the modal">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    <Text style={[{marginTop: 40, marginBottom:10, color:"#BA548C", fontWeight: "bold", alignSelf: "center"}, styles.titleTxt]}>EMS Reporting Application</Text>
      <MapView 
        initialRegion={{latitude: 43.2387,
                        longitude: -79.8881,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1 }
                      }
        style={{height: 400, width: 400}} >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{latitude: marker.latitude, 
                         longitude: marker.longitude}}
            title={marker.title}
            description={marker.description}
            pinColor={marker.color}
            
            onPress={() => modalPic(marker)}>
         </Marker>
        ))}
      </MapView>
        <View style={{flexDirection:"row"}}>
        <View style={{flex:1}}>
      <Pressable style= {emsPrompt== "EMS Stations" ? styles.bEnabled : styles.bDisabled} onPress={putEMSonMap}>
      <Text accessible={true}
        accessibilityLabel={emsPrompt}
        accessibilityHint="This is the button that will place and remove the Emergency Medical Service markers on the map">{emsPrompt}</Text></Pressable>
        </View>
      <View style={{flex:1}}>
           <Pressable style={geolocation.prompt == "Geolocation" ? styles.bEnabled : styles.bDisabled} onPress={putGeolocation} >
           <Text accessible={true}
        accessibilityLabel={geolocation.prompt}
        accessibilityHint="This is the button that will place and remove the Geoloaction markers on the map">
        {geolocation.prompt}</Text></Pressable>
      </View>
        </View>
        <Pressable style={markers.length != 0 ? styles.bEnabled : styles.bDisabled} onPress={removeAllMarkers} disabled={markers.length != 0 ? false : true} ><Text
         accessible={true}
        accessibilityLabel= "Remove All Markers"
        accessibilityHint="This is the button that will clear all markers on the map">Remove All Markers</Text></Pressable>

      <Text style={styles.titleTxt}>Set User Incident:</Text>
      <Text style={styles.labelTxt}>Please Input Latitude and Longitude of Incident:</Text>
      <View style={{flexDirection:"row"}}>
      <View style={{flex:1}}>
      <TextInput placeholder="Latitude" 
        style={{justifyContent: 'flex-start'},  styles.input} 
        value={inputLatitude}
        onChangeText={setInputLatitude}
      />
        </View>
      <View style={{flex:1}}>
          <TextInput placeholder="Longitude" 
          style={{justifyContent: 'flex-end', }, styles.input} 
          value={inputLongitude}
          onChangeText={setInputLongitude}/>
      </View>
        </View>
      <Text style = {styles.labelTxt}>Please Input Incident Name: </Text>
      <TextInput placeholder="Name of Incident" 
              style={ styles.input}
              value={inputName}
              onChangeText={setInputName} />
       <Text style = {styles.labelTxt}>Please Input Incident Description: </Text>
      <TextInput multiline = {true} 
              placeholder="Description of Incident" 
              style={ styles.input}
              value={inputDescription}
              onChangeText={setInputDescription} />
       <Pressable style={styles.bEnabled} onPress={putUserReport} ><Text 
       accessible={true}
        accessibilityLabel= "Set Incident"
        accessibilityHint="This is the button that will add a new incident to the map"
        style= {{textAlign:"center"}}>Set Incident</Text></Pressable>
    </View>
      <View style={showCamera == false ? {display: 'none'}: {display: 'flex', flexDirection: 'column'}}>
     <Camera style={styles.containerCamera} ref={cameraRef} >
     </Camera>
     <Pressable style={styles.bEnabled} onPress={takePic}><Text style={{textAlign:"center"}}>Take Picture</Text></Pressable>
    </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  bEnabled: {
    justifyContent: 'space-between',
    padding: 10,
    gap: 100,
    backgroundColor: '#CE84AD',
    paddingVertical: 10,
    borderRadius: 4,
    margin: 10,
    fontSize: 16
  },
  bDisabled: {
    justifyContent: 'space-between',
    padding: 10,
    gap: 100,
    backgroundColor: '#E2C6D6',
    paddingVertical: 10,
    borderRadius: 4,
    margin: 10,
    fontSize: 16
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
   modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  containerCamera: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 400,
    height: 600,
  },
  labelTxt:  {
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10

  },
   titleTxt:  {
    fontSize: 20,
    marginLeft: 10,
    marginRight: 10
  }

});
