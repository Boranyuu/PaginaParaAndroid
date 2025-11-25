import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function App() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  // Cargar actividades desde Firestore
  useEffect(() => {
    const cargarActividades = async () => {
      const snapshot = await getDocs(collection(db, "actividades"));
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        start: d.data().date, // ← FullCalendar requiere "start"
      }));
      setEvents(data);
    };
    cargarActividades();
  }, []);

  // Agregar nueva actividad
  const agregarActividad = async (e) => {
    e.preventDefault();
    if (!title || !date) return alert("Completa todos los campos");

    const nuevaActividad = { title, date };
    const docRef = await addDoc(collection(db, "actividades"), nuevaActividad);

    // Convertir date → start para FullCalendar
    setEvents([...events, { id: docRef.id, title, start: date }]);

    setTitle("");
    setDate("");
  };

  // Eliminar actividad al hacer clic
  const manejarClickEvento = async (clickInfo) => {
    const confirmar = window.confirm(
      `¿Eliminar la actividad "${clickInfo.event.title}"?`
    );
    if (confirmar) {
      await deleteDoc(doc(db, "actividades", clickInfo.event.id));
      setEvents(events.filter((ev) => ev.id !== clickInfo.event.id));
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <h2>📅 Calendario de Actividades</h2>

      <form onSubmit={agregarActividad} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Título de la actividad"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button type="submit">Agregar</button>
      </form>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="es"
        height="auto"
        events={events}
        eventClick={manejarClickEvento}
      />
    </div>
  );
}
