import { pendientes, site } from "../config/site";

/**
 * Borrador del aviso de privacidad integral.
 * Basado en la auditoría del 26 de octubre de 2026 y en la LFPDPPP
 * publicada en el DOF el 20 de marzo de 2025. No es asesoría legal.
 */

export const privacidad = {
  title: "Aviso de privacidad | MentalCareClinic",
  description:
    "Aviso de privacidad de MentalCareClinic, Tuxtla Gutiérrez: qué datos personales y de salud tratamos, para qué y cómo ejercer sus derechos ARCO. Léalo aquí.",
  h1: "Aviso de privacidad",
  lead: "Aviso de privacidad de MentalCareClinic, Tuxtla Gutiérrez: qué datos personales y de salud tratamos, para qué y cómo ejercer sus derechos ARCO. Léalo aquí.",
  whatsappMessage:
    "Hola. Quiero información sobre MentalCareClinic. No enviaré datos de salud por este medio.",
  aviso:
    "Borrador pendiente de revisión legal. Este texto no es asesoría legal. No lo use como aviso definitivo hasta que lo revise un abogado. Lo que está entre corchetes está pendiente.",
  actualizacion: `Borrador preparado el 26 de octubre de 2026. Fecha de publicación del aviso revisado: ${pendientes.fechaAviso}.`,
  secciones: [
    {
      titulo: "1. Identidad y domicilio del responsable",
      parrafos: [
        `${pendientes.razonSocial}, que opera con el nombre comercial MentalCareClinic (Consulta Externa y Estancia Residencial), con domicilio en ${pendientes.direccion}, ${site.direccion.entre}, ${site.direccion.colonia}, ${pendientes.codigoPostal}, ${site.direccion.ciudad}, ${site.direccion.estado}, es responsable del tratamiento de sus datos personales. Domicilio fiscal: ${pendientes.domicilioFiscal}. RFC: ${pendientes.rfc}.`,
        `Contacto de privacidad: ${pendientes.correoPrivacidad}. Teléfono: ${pendientes.telefonoPrivacidad}. Persona o área de datos personales: ${pendientes.responsableDatos}. El correo general de la clínica, distinto del de privacidad, es ${site.email}.`,
      ],
    },
    {
      titulo: "2. Datos personales que tratamos",
      parrafos: [
        `Identificación y contacto: nombre, fecha de nacimiento, edad, sexo, domicilio, teléfono, correo, identificación oficial, ${pendientes.curp}. Del familiar o responsable: nombre, parentesco, identificación, domicilio y contacto.`,
        `Datos de facturación y pago: ${pendientes.facturacion}.`,
        `Datos personales sensibles: estado de salud física y mental presente y pasado, diagnósticos, antecedentes clínicos y familiares, tratamientos y medicamentos, resultados de estudios, notas de evolución, valoraciones psiquiátricas y psicológicas, consumo de sustancias, y ${pendientes.otrosSensibles}. También podemos tratar imágenes de videovigilancia en las instalaciones. ${pendientes.videovigilancia}.`,
      ],
    },
    {
      titulo: "3. Finalidades necesarias",
      parrafos: [
        "Estas finalidades dan origen al servicio y no requieren un consentimiento aparte: a) agendar la cita informativa, la prevaloración y la valoración; b) prestar atención de psiquiatría, psicología, psicoterapia, medicina general, enfermería y acompañamiento; c) integrar y conservar el expediente clínico conforme a la normativa sanitaria; d) administrar la estancia residencial: ingreso, plan individual, medicación, visitas, salidas y egreso; e) comunicarnos con el familiar o responsable designado; f) referir a otro nivel de atención o a urgencias cuando sea necesario; g) facturar y cobrar; h) cumplir obligaciones legales y requerimientos de autoridad.",
        `Norma de expediente clínico señalada en el borrador: ${pendientes.nom004}.`,
      ],
    },
    {
      titulo: "4. Finalidades que no son necesarias",
      parrafos: [
        "Requieren su consentimiento y puede negarse sin que eso afecte la atención: a) enviar información de servicios, talleres y contenidos educativos; b) encuestas de satisfacción; c) usar testimonios, fotografías o videos en el sitio o en redes sociales, siempre con autorización por escrito y por separado.",
        `Si no quiere que usemos sus datos para esas finalidades, puede marcarlo en el formato correspondiente o escribir a ${pendientes.correoPrivacidad}: no acepto recibir información de servicios; no acepto encuestas; no acepto el uso de testimonios o imágenes.`,
      ],
    },
    {
      titulo: "5. Consentimiento para datos sensibles",
      parrafos: [
        "Sus datos de salud se tratan solo con su consentimiento expreso y por escrito, otorgado con firma autógrafa, firma electrónica u otro mecanismo de autenticación. Se recaba en el formato de ingreso o de primera consulta: “Consiento que mis datos personales sensibles sean tratados conforme a este aviso de privacidad. Nombre y firma: ________”.",
        "No se pide consentimiento cuando la ley lo exceptúa, por ejemplo en una emergencia o cuando la atención médica es indispensable y la persona no está en condiciones de otorgarlo, por personal sujeto a secreto profesional.",
      ],
    },
    {
      titulo: "6. Menores de edad y personas que no pueden consentir",
      parrafos: [
        `Si el paciente es menor de edad o no puede otorgar su consentimiento, lo otorga quien ejerza la patria potestad, la tutela o la representación, y debe acreditar su personalidad. ${pendientes.menores}.`,
      ],
    },
    {
      titulo: "7. Transferencias",
      parrafos: [
        `Podemos compartir sus datos sin un consentimiento adicional cuando la ley lo permite: con médicos, hospitales, laboratorios o servicios de urgencia para el diagnóstico o el tratamiento; con autoridades sanitarias o judiciales cuando lo exijan; y con ${pendientes.aseguradoras}.`,
        `Cualquier otra transferencia requiere su consentimiento. ${pendientes.terceros}.`,
        `Los proveedores que tratan datos por nuestra cuenta —por ejemplo correo y almacenamiento, mensajería de WhatsApp y el sistema de expediente— actúan como encargados y no son transferencias. ${pendientes.encargados}.`,
      ],
    },
    {
      titulo: "8. Cómo limitar el uso o la divulgación",
      parrafos: [
        `Puede pedir su inscripción en nuestro listado de exclusión para no recibir información promocional, escribiendo a ${pendientes.correoPrivacidad}. También puede inscribirse en el Registro Público para Evitar Publicidad de la PROFECO. ${pendientes.profeco}.`,
      ],
    },
    {
      titulo: "9. Derechos ARCO",
      parrafos: [
        `Puede solicitar acceso, rectificación, cancelación u oposición en ${pendientes.correoPrivacidad} o en persona en el domicilio del responsable, en horario ${pendientes.horarioArco}. La solicitud lleva: nombre y un medio para recibir la respuesta; documento que acredite su identidad o la de su representante; descripción clara de los datos y del derecho que quiere ejercer; y cualquier dato que ayude a localizar la información.`,
        "Para rectificar, indique el cambio y anexe el soporte. El plazo de respuesta es de un máximo de 20 días desde que se recibe la solicitud y, si procede, se hace efectiva dentro de los 15 días siguientes. El trámite es gratuito; solo podrían cobrarse gastos de envío o de copias.",
        `La cancelación puede no proceder cuando la ley obliga a conservar el expediente clínico. ${pendientes.plazoExpediente}.`,
      ],
    },
    {
      titulo: "10. Revocar el consentimiento",
      parrafos: [
        `Puede revocarlo en cualquier momento, sin efectos retroactivos, con una solicitud a ${pendientes.correoPrivacidad} y los mismos requisitos del punto 9. Algunas obligaciones legales pueden impedir dejar de tratar ciertos datos de inmediato. Revocar el consentimiento puede impedir que sigamos dando el servicio.`,
      ],
    },
    {
      titulo: "11. Cookies y tecnologías de rastreo",
      parrafos: [
        "[REVISAR CON ABOGADO: este párrafo se actualizó porque el sitio ya no está en Google Sites.] El sitio www.mentalcareclinic.com puede usar Google Analytics 4 y el píxel de Meta únicamente si usted lo acepta en el aviso de cookies, para medir visitas de forma agregada (páginas vistas, dispositivo, ciudad aproximada) y clics a WhatsApp o al teléfono. Si no hay identificadores configurados, o si usted rechaza, esas herramientas no se cargan.",
        "No usamos esas herramientas para recabar datos de salud ni para enviar el contenido de sus mensajes. Su decisión se guarda en este navegador (almacenamiento local). Las cookies de analítica, si acepta, las instalan Google y Meta. Puede borrarlas o bloquearlas desde su navegador. Los nombres de evento que usamos son neutros: contacto por WhatsApp y contacto por llamada.",
        "El mapa de la página de contacto no se carga hasta que usted pide verlo. Ese mapa es de Google.",
      ],
    },
    {
      titulo: "12. WhatsApp y canales digitales",
      parrafos: [
        "Por WhatsApp o por correo solo pedimos lo necesario para agendar. Le pedimos no enviar información clínica detallada por estos medios. Esa información se recaba en la valoración.",
      ],
    },
    {
      titulo: "13. Cambios a este aviso",
      parrafos: [
        "Cualquier cambio se publica en www.mentalcareclinic.com/aviso-de-privacidad, con la fecha de actualización, y se informa en recepción y por correo a pacientes activos cuando corresponda.",
      ],
    },
    {
      titulo: "14. Autoridad",
      parrafos: [
        "Si considera que su derecho a la protección de datos fue vulnerado, puede acudir a la Secretaría Anticorrupción y Buen Gobierno.",
      ],
    },
    {
      titulo: "Aviso simplificado",
      parrafos: [
        `Donde se recaben datos —formato de ingreso, primera consulta y mensaje de WhatsApp— debe mostrarse un aviso corto con los puntos 1 a 4 y el enlace a esta página. ${pendientes.avisoSimplificado}.`,
      ],
    },
  ],
} as const;
