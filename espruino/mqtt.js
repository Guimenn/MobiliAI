const WIFI_SSID = "Renan";
const WIFI_PASS = "renan2005";
const WIFI_HOSTNAME = "ESP32_do_Palmieri";

const MQTT_BROKER = "10.70.124.30";

const MQTT_CLIENT = "ESP32_do_Palmieri";

const TOPIC_RFID = "palmieri/tag"

SPI2.setup();
let rfid = require("MFRC522.js").connect(SPI2);
let wifi = require("Wifi");
let mqtt = require("MQTT").create(MQTT_BROKER, {client_id: MQTT_CLIENT});

wifi.connect(WIFI_SSID, {password: WIFI_PASS});
wifi.setHostname(WIFI_HOSTNAME);

wifi.on("connected", function() {
    console.log("Conectado ao WiFi");
    console.log(wifi.getStatus());
    console.log();
    mqtt.connect();
})

wifi.on("disconnected", function() {
    console.log("Desconectado do WiFi");
    console.log("Conectando novamente...\n");
    wifi.connect(WIFI_SSID, {password: WIFI_PASS});
    
})

mqtt.on("connect", function() {

    console.log("MQTT conectado!\n");
})

mqtt.on("disconnect", function() {

    console.log("MQTT Desconectado!\n");
    console.log("Conectando novamente...\n");
    mqtt.connect();
})

setInterval(function() {
    let nuid = rfid.readCard();

    if (nuid != "")
    {
        console.log(nuid);
        mqtt.publish(TOPIC_RFID, nuid);
    }
    
}, 1000);
