import { db } from "./firebase.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc }
    from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async function () {

    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');

    const actividadNombre = document.getElementById('actividadNombre');
    const actividadTipo = document.getElementById('actividadTipo');
    const actividadDescripcion = document.getElementById('actividadDescripcion');
    const actividadBeneficiarios = document.getElementById('actividadBeneficiarios');
    const actividadLugar = document.getElementById('actividadLugar');
    const actividadSocioComunitario = document.getElementById('actividadSocioComunitario');
    const actividadOferente = document.getElementById('actividadOferente');
    const actividadPeriodicidad = document.getElementById('actividadPeriodicidad');
    const actividadFrecuencia = document.getElementById('actividadFrecuencia');
    const actividadFechaInicio = document.getElementById('actividadFechaInicio');
    const actividadDuracion = document.getElementById('actividadDuracion');
    const actividadCupo = document.getElementById('actividadCupo');
    const actividadDiasAviso = document.getElementById('actividadDiasAviso');

    const saveBtn = document.getElementById('saveEvent');
    const deleteBtn = document.getElementById('deleteEvent');
    const btnCrear = document.getElementById('btnCrearEvento');

    let actividadSeleccionada = null;

    // Cargar opciones desde Firestore
    async function cargarOpciones() {
        const colecciones = [
            { id: "actividadTipo", nombre: "tiposActividad" },
            { id: "actividadLugar", nombre: "lugares" },
            { id: "actividadSocioComunitario", nombre: "sociosComunitarios" },
            { id: "actividadOferente", nombre: "oferentes" }
        ];

        for (const col of colecciones) {
            const select = document.getElementById(col.id);
            select.innerHTML = '<option value="">Seleccione...</option>';
            const snapshot = await getDocs(collection(db, col.nombre));
            snapshot.forEach(docSnap => {
                const opt = document.createElement("option");
                opt.value = docSnap.data().nombre;
                opt.textContent = docSnap.data().nombre;
                select.appendChild(opt);
            });
        }
    }

    await cargarOpciones();

    function abrirModal(actividad = null) {
        modal.style.display = "flex";

        if (actividad) {
            modalTitle.textContent = "Editar Actividad";
            actividadNombre.value = actividad.nombre;
            actividadTipo.value = actividad.tipo;
            actividadDescripcion.value = actividad.descripcion;
            actividadBeneficiarios.value = actividad.beneficiarios.join(", ");
            actividadLugar.value = actividad.lugar;
            actividadSocioComunitario.value = actividad.socioComunitario;
            actividadOferente.value = actividad.oferente;
            actividadPeriodicidad.value = actividad.periodicidad;
            actividadFrecuencia.value = actividad.frecuencia;
            actividadFechaInicio.value = new Date(actividad.fechaInicio).toISOString().split("T")[0];
            actividadDuracion.value = actividad.duracionMin;
            actividadCupo.value = actividad.cupo;
            actividadDiasAviso.value = actividad.diasAvisoPrevio;
            actividadSeleccionada = actividad;
            deleteBtn.style.display = "inline-block";
        } else {
            modalTitle.textContent = "Nueva Actividad";
            actividadNombre.value = "";
            actividadTipo.value = "";
            actividadDescripcion.value = "";
            actividadBeneficiarios.value = "";
            actividadLugar.value = "";
            actividadSocioComunitario.value = "";
            actividadOferente.value = "";
            actividadPeriodicidad.value = "Puntual";
            actividadFrecuencia.value = "";
            actividadFechaInicio.value = "";
            actividadDuracion.value = "";
            actividadCupo.value = "";
            actividadDiasAviso.value = "";
            actividadSeleccionada = null;
            deleteBtn.style.display = "none";
        }
    }

    const closeModal = document.getElementById('closeModal');
    closeModal.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; }

    const calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: "dayGridMonth",
        locale: "es",
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' // Lista agregada
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            list: 'Lista'
        },
        events: async (fetchInfo, successCallback) => {
            try {
                const snapshot = await getDocs(collection(db, "actividades"));
                const actividades = snapshot.docs.map(docSnap => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        title: data.nombre,
                        start: new Date(data.fechaInicio),
                        ...data
                    };
                });
                successCallback(actividades);
            } catch (error) {
                console.error("Error cargando actividades:", error);
            }
        },
        eventClick: info => {
            const actividad = {
                id: info.event.id,
                title: info.event.title,
                start: info.event.start,
                ...info.event.extendedProps
            };
            abrirModal(actividad);
        }
    });

    calendar.render();

    btnCrear.onclick = () => abrirModal();

    saveBtn.onclick = async () => {
        const actividad = {
            nombre: actividadNombre.value.trim(),
            tipo: actividadTipo.value.trim(),
            descripcion: actividadDescripcion.value.trim(),
            beneficiarios: actividadBeneficiarios.value.split(",").map(x => x.trim()),
            lugar: actividadLugar.value.trim(),
            socioComunitario: actividadSocioComunitario.value.trim(),
            oferente: actividadOferente.value.trim(),
            periodicidad: actividadPeriodicidad.value,
            frecuencia: actividadFrecuencia.value.trim(),
            fechaInicio: new Date(actividadFechaInicio.value).getTime(),
            duracionMin: Number(actividadDuracion.value),
            cupo: Number(actividadCupo.value),
            diasAvisoPrevio: Number(actividadDiasAviso.value),
            estado: "activa",
            motivoCancelacion: null,
            citas: []
        };

        try {
            if (actividadSeleccionada) {
                await updateDoc(doc(db, "actividades", actividadSeleccionada.id), actividad);
            } else {
                await addDoc(collection(db, "actividades"), actividad);
            }
            modal.style.display = "none";
            calendar.refetchEvents();
        } catch (error) {
            console.error("Error guardando actividad:", error);
        }
    };

    deleteBtn.onclick = async () => {
        if (!actividadSeleccionada) return;
        try {
            await deleteDoc(doc(db, "actividades", actividadSeleccionada.id));
            modal.style.display = "none";
            calendar.refetchEvents();
        } catch (error) {
            console.error("Error eliminando actividad:", error);
        }
    };
});
