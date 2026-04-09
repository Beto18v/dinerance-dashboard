export type SiteLocale = "es" | "en";

export const defaultSiteLocale: SiteLocale = "es";
export const siteLocales: SiteLocale[] = ["es", "en"];

export function isSiteLocale(value: string): value is SiteLocale {
  return siteLocales.includes(value as SiteLocale);
}

const mainPageContent = {
  es: {
    seo: {
      title: "Dinerance | Finanzas personales, ingresos y gastos",
      description:
        "Dinerance es una app de finanzas personales para registrar ingresos y gastos con fecha real, organizar movimientos y entender tu balance mensual.",
    },
    header: {
      brand: "Dinerance",
      subtitle: "Finanzas personales",
      dashboard: "Panel",
      signIn: "Iniciar sesion",
      logoAlt: "Dinerance",
    },
    hero: {
      badge: "Finanzas personales",
      title: "Controla tus finanzas",
      accent: "con claridad total",
      description: "Ve exactamente en qué se va tu dinero, sin complicaciones.",
      ctaAuthenticated: "Ir al panel",
      ctaGuest: "Empieza a controlar tu dinero hoy",
      supporting: "App para ingresos, gastos y balance en un solo lugar.",
      logoAlt: "Logo de Dinerance",
    },
    background: {
      billCode: "DNR",
      billAmounts: ["120", "480", "260", "720", "90"],
      currencySymbol: "$",
    },
  },
  en: {
    seo: {
      title: "Dinerance | Personal finance, income and expenses",
      description:
        "Dinerance is a personal finance app to track income and expenses with real dates, organize transactions, and understand your monthly balance.",
    },
    header: {
      brand: "Dinerance",
      subtitle: "Personal finance",
      dashboard: "Dashboard",
      signIn: "Sign in",
      logoAlt: "Dinerance",
    },
    hero: {
      badge: "Personal finance",
      title: "Control your finances",
      accent: "with total clarity",
      description: "See exactly where your money goes, without the hassle.",
      ctaAuthenticated: "Go to dashboard",
      ctaGuest: "Start managing your money today",
      supporting: "Income, expenses, and balance in one place.",
      logoAlt: "Dinerance logo",
    },
    background: {
      billCode: "DNR",
      billAmounts: ["120", "480", "260", "720", "90"],
      currencySymbol: "$",
    },
  },
} as const;

const siteTexts = {
  es: {
    metadata: {
      title: mainPageContent.es.seo.title,
      description: mainPageContent.es.seo.description,
      htmlLang: "es",
    },
    common: {
      loading: "Cargando...",
      unexpectedError: "Error inesperado",
      mobileTableScrollHint: "Desliza para ver mas columnas.",
      mainFinancialAccount: "Cuenta principal",
      none: "Ninguno",
      all: "Todos",
      clearFilters: "Limpiar filtros",
      refresh: "Actualizar",
      cancel: "Cancelar",
      saveChanges: "Guardar cambios",
      edit: "Editar",
      delete: "Eliminar",
      actions: "Acciones",
      direction: "Direccion",
      category: "Categoria",
      date: "Fecha",
      amount: "Monto",
      currency: "Moneda",
      description: "Descripcion",
      dash: "-",
      income: "Ingreso",
      expense: "Gasto",
    },
    appLayout: {
      mobileMenuTitle: "Menu",
      mobileMenuDescription: "Navega por tu panel y administra tu sesion.",
      nav: {
        balance: "Resumen",
        cashflow: "Caja futura",
        analysis: "Analisis",
        obligations: "Obligaciones",
        transactions: "Transacciones",
        categories: "Categorias",
        profile: "Perfil",
      },
      obligationsAlertOpen: "Abrir obligaciones",
      obligationsAlertMixedBanner: (
        overdueCount: number,
        dueTodayCount: number,
      ) =>
        `Tienes ${overdueCount} ${
          overdueCount === 1
            ? "obligacion vencida activa"
            : "obligaciones vencidas activas"
        } y ${dueTodayCount} ${
          dueTodayCount === 1 ? "que vence hoy" : "que vencen hoy"
        }.`,
      obligationsAlertOverdueBanner: (count: number) =>
        count === 1
          ? "Tienes 1 obligacion vencida que sigue activa."
          : `Tienes ${count} obligaciones vencidas que siguen activas.`,
      obligationsAlertTodayBanner: (count: number) =>
        count === 1
          ? "Tienes 1 obligacion que vence hoy."
          : `Tienes ${count} obligaciones que vencen hoy.`,
      signOut: "Cerrar sesion",
    },
    auth: {
      login: {
        title: "Iniciar sesion",
        email: "Correo",
        password: "Contrasena",
        submit: "Iniciar sesion",
        submitting: "Iniciando sesion...",
        google: "Continuar con Google",
        googleSubmitting: "Redirigiendo a Google...",
        orContinueWithEmail: "o sigue con correo",
        noAccount: "No tienes cuenta?",
        register: "Registrate",
        notRegistered: "El usuario no esta registrado.",
        validations: {
          invalidEmail: "Correo invalido",
          passwordRequired: "La contrasena es obligatoria",
        },
        successToast: "Sesion iniciada correctamente",
      },
      register: {
        title: "Crear cuenta",
        name: "Nombre",
        email: "Correo",
        password: "Contrasena",
        confirmPassword: "Confirmar contrasena",
        submit: "Crear cuenta",
        submitting: "Creando cuenta...",
        google: "Registrarse con Google",
        googleSubmitting: "Redirigiendo a Google...",
        orContinueWithEmail: "o crea tu cuenta con correo",
        hasAccount: "Ya tienes cuenta?",
        signIn: "Inicia sesion",
        validations: {
          nameRequired: "El nombre es obligatorio",
          invalidEmail: "Correo invalido",
          passwordMin: "La contrasena debe tener al menos 8 caracteres",
          confirmRequired: "Confirma tu contrasena",
          passwordsDontMatch: "Las contrasenas no coinciden",
        },
        successToast: "Cuenta creada correctamente.",
        profileCreatedToast: "Usuario creado correctamente.",
      },
    },
    pages: {
      main: mainPageContent.es,
      balance: {
        title: "Resumen",
        subtitle:
          "Ve tu dinero disponible hoy, el total entre cuentas y los ultimos movimientos.",
        heading: (monthLabel: string) => `Resumen financiero - ${monthLabel}`,
        monthLabel: "Mes",
        accountLabel: "Cuenta",
        allAccountsLabel: "Todas las cuentas",
        allAccountsActivityLabel: "Todas las cuentas",
        currentCashTitle: "Dinero disponible hoy",
        currentCashDescription: (
          currency: string,
          accountName?: string | null,
        ) =>
          accountName
            ? `Lo que tienes disponible hoy en ${accountName}, en ${currency}.`
            : `Lo que tienes disponible hoy entre todas tus cuentas, en ${currency}.`,
        currentCashHelpTitle: "Como funciona este resumen?",
        currentCashHelpDescription:
          "Aqui ves tu dinero disponible de hoy. Sumamos ingresos, restamos gastos y tambien contamos movimientos entre tus cuentas y ajustes manuales.",
        currentCashDistributionTitle: "Como se reparte hoy",
        currentCashDistributionDescription:
          "Una vista rapida de donde esta tu dinero disponible en este momento.",
        currentCashDistributionHelpTitle: "Como leer esta visual?",
        currentCashDistributionHelpDescription:
          "Cada barra muestra que parte de tu dinero disponible esta en una cuenta hoy. Te ayuda a ubicar rapido donde se concentra el efectivo.",
        currentCashDistributionOtherAccounts: (count: number) =>
          count === 1 ? "+1 cuenta mas" : `+${count} cuentas mas`,
        consolidatedBalanceLabel: "Total entre tus cuentas",
        consolidatedBalanceHelpTitle: "Que significa este total?",
        consolidatedBalanceHelpDescription:
          "Es la suma del dinero disponible en todas tus cuentas. Mover dinero entre tus propias cuentas no cambia este total.",
        selectedAccountBalanceLabel: (accountName: string) =>
          `Disponible en ${accountName}`,
        selectedAccountBalanceFallback: "Saldo seleccionado",
        accountsTitle: "Dinero por cuenta",
        accountsDescription:
          "Toca una cuenta para ver solo su dinero disponible y sus ultimos movimientos.",
        accountsHelpTitle: "Que cuenta aqui?",
        accountsHelpDescription:
          "Cada cuenta sube o baja con ingresos, gastos, movimientos entre cuentas y ajustes manuales.",
        recentActivityTitle: "Ultimos movimientos",
        recentActivityDescription:
          "Lo mas reciente que cambio tu dinero disponible.",
        recentActivityHelpTitle: "Que veras aqui?",
        recentActivityHelpDescription:
          "Aqui aparecen ingresos, gastos, movimientos entre cuentas y ajustes manuales, porque todos cambian tu dinero disponible. En Analisis solo veras ingresos y gastos del mes.",
        recentActivityEmpty: "Todavia no hay cuentas para mostrar.",
        actionsTitle: "Cuentas activas",
        actionsDescription:
          "Mueve dinero entre cuentas o corrige un saldo sin mezclarlo con el analisis mensual.",
        addTransfer: "Mover entre cuentas",
        addAdjustment: "Ajustar saldo",
        transferTitle: "Mover entre cuentas",
        transferDescription:
          "Pasa dinero de una cuenta a otra. Esto no cuenta como ingreso ni como gasto.",
        transferFrom: "Cuenta origen",
        transferTo: "Cuenta destino",
        adjustmentTitle: "Ajustar saldo",
        adjustmentDescription:
          "Usalo si tu dinero real no coincide con la app o para registrar con cuanto empezaste.",
        adjustmentType: "Para que lo haces?",
        adjustmentTypeOpening: "Saldo inicial",
        adjustmentTypeCorrection: "Corregir diferencia",
        adjustmentTypeOpeningHelpTitle: "Cuando usar saldo inicial?",
        adjustmentTypeOpeningHelpDescription:
          "Usalo cuando una cuenta ya tenia dinero antes de empezar a usar Dinerance. Registra con cuanto arrancas esa cuenta, sin contarlo como ingreso del mes.",
        adjustmentTypeCorrectionHelpTitle: "Cuando corregir una diferencia?",
        adjustmentTypeCorrectionHelpDescription:
          "Usalo cuando el saldo real de la cuenta no coincide con la app. Sirve para sumar o restar la diferencia y dejar el saldo actual alineado con la realidad.",
        adjustmentDirection: "Que paso con el dinero?",
        adjustmentDirectionIn: "Entro dinero",
        adjustmentDirectionOut: "Salio dinero",
        createTransfer: "Guardar movimiento",
        creatingTransfer: "Guardando movimiento...",
        createAdjustment: "Guardar ajuste",
        creatingAdjustment: "Creando ajuste...",
        transferCreated: "Transferencia creada",
        adjustmentCreated: "Ajuste creado",
        transferDeleted: "Transferencia eliminada",
        adjustmentDeleted: "Ajuste eliminado",
        failedLoadLedger: "No se pudo cargar tu resumen",
        failedCreateTransfer: "No se pudo crear la transferencia",
        failedCreateAdjustment: "No se pudo crear el ajuste",
        failedDeleteTransfer: "No se pudo eliminar la transferencia",
        failedDeleteAdjustment: "No se pudo eliminar el ajuste",
        failedLoadUpcomingObligations:
          "No se pudieron cargar los proximos vencimientos",
        failedLoadCashflowForecast: "No se pudo cargar tu caja futura",
        emptyStateTitle: "Empieza a registrar tu dinero real",
        emptyStateDescription:
          "Tu resumen se alimenta de ingresos, gastos, transferencias y ajustes.",
        distinctAccountsRequired: "Debes elegir dos cuentas diferentes",
        deleteTransferTitle: "Eliminar transferencia?",
        deleteTransferDescription: (description?: string | null) =>
          description
            ? `Se eliminaran ambos movimientos de la transferencia "${description}".`
            : "Se eliminaran ambos movimientos de la transferencia.",
        deleteAdjustmentTitle: "Eliminar ajuste?",
        deleteAdjustmentDescription: (description?: string | null) =>
          description
            ? `Se eliminara el ajuste "${description}".`
            : "Se eliminara este ajuste.",
        activityTransferLabel: "Entre cuentas",
        activityAdjustmentLabel: "Ajuste manual",
        activityIncomingLabel: "Entrada",
        activityOutgoingLabel: "Salida",
        onboardingCashTitle:
          "Completa tu perfil para activar tu dinero disponible",
        onboardingCashDescription:
          "Define moneda base y zona horaria antes de empezar a usar este resumen.",
        latestMonthHint:
          "Si no eliges un mes, se muestra el ultimo mes con movimientos.",
        currentCardDescription: (
          currency: string,
          accountName?: string | null,
        ) =>
          accountName
            ? `Vista de ingresos, gastos y balance en ${currency} para ${accountName}.`
            : `Vista consolidada de ingresos, gastos y balance en ${currency}.`,
        currentCardPendingDescription:
          "Completa tu perfil financiero para ver analytics coherentes en tu moneda base.",
        categoryBreakdownTitle: "Distribucion por categoria",
        categoryBreakdownDescription:
          "Muestra en que categorias se concentraron tus ingresos o tus gastos del mes.",
        categoryBreakdownHelpTitle: "Como leer esta distribucion?",
        categoryBreakdownHelpDescription:
          "Aqui agrupamos solo ingresos o solo gastos del mes seleccionado. No incluimos movimientos entre tus cuentas ni ajustes manuales.",
        categoryBreakdownExpenseTab: "Gastos",
        categoryBreakdownIncomeTab: "Ingresos",
        categoryBreakdownExpenseTotal: "Total de gastos",
        categoryBreakdownIncomeTotal: "Total de ingresos",
        categoryBreakdownCategoriesCount: (count: number) =>
          `${count} categorias en esta distribucion.`,
        categoryBreakdownTransactionsCount: (count: number) =>
          count === 1 ? "1 movimiento" : `${count} movimientos`,
        categoryBreakdownEmptyExpense: "No hay gastos en el mes seleccionado.",
        categoryBreakdownEmptyIncome: "No hay ingresos en el mes seleccionado.",
        categoryBreakdownSkippedNotice: (count: number, currency: string) =>
          `${count} transacciones quedaron fuera porque no se pudieron convertir de forma segura a ${currency}.`,
        onboardingTitle: "Configura tu balance",
        onboardingDescription:
          "Completa estos cuatro pasos para empezar a ver tu balance mensual con datos consistentes.",
        onboardingBaseCurrencyStepTitle: "Elegir moneda base",
        onboardingBaseCurrencyStepDescription:
          "Sera la moneda fija de tu cuenta y de todos los totales.",
        onboardingTimeZoneStepTitle: "Elegir zona horaria",
        onboardingTimeZoneStepDescription:
          "La usaremos para ubicar cada movimiento en el dia y mes correctos.",
        onboardingCategoryStepTitle: "Crear una categoria",
        onboardingCategoryStepDescription:
          "Organiza tus ingresos o gastos antes de registrar movimientos.",
        onboardingTransactionStepTitle: "Registrar una transaccion",
        onboardingTransactionStepDescription:
          "Agrega tu primer movimiento para que el balance empiece a calcularse.",
        onboardingCompleted: "Completado",
        onboardingPending: "Pendiente",
        onboardingProfilePromptTitle: "Completa tu perfil financiero",
        onboardingProfilePromptDescription:
          "Define tu moneda base y tu zona horaria para registrar movimientos y ver analytics consistentes desde el inicio.",
        onboardingCategoryPromptTitle: "Crea tu primera categoria",
        onboardingCategoryPromptDescription:
          "Crea al menos una categoria para empezar a organizar tus movimientos.",
        onboardingTransactionPromptTitle: "Registra tu primer movimiento",
        onboardingTransactionPromptDescription:
          "Con tu perfil y categorias listos, agrega una transaccion para empezar a ver resultados.",
        historyTitle: "Balance mensual",
        historyDescription: "Todos los meses con movimientos registrados.",
        recentTransactionsTitle: "Movimientos recientes",
        recentTransactionsDescription:
          "Ultimos movimientos del mes seleccionado.",
        recentTransactionsEmpty:
          "No hay movimientos en el mes seleccionado para mostrar aqui.",
        recurringCandidatesTitle: "Patrones recurrentes detectados",
        recurringCandidatesDescription:
          "Inferencias del historial reciente. Los gastos pueden confirmarse como obligaciones; los ingresos se quedan como lectura analitica.",
        recurringCandidatesHelpTitle: "Como leer estos patrones?",
        recurringCandidatesHelpDescription:
          "Son inferencias basadas en movimientos parecidos que vimos repetirse. No son compromisos confirmados hasta que conviertes un gasto en obligacion.",
        recurringCandidatesEmpty:
          "Todavia no encontramos patrones recurrentes con suficiente evidencia.",
        recurringCandidatesViewAll: "Ver analisis",
        recurringCandidatesIncome: "Ingreso frecuente",
        recurringCandidatesExpense: "Gasto frecuente",
        recurringCandidatesInferred: "Inferido",
        recurringCandidatesConfirmed: "Ya confirmada",
        recurringCandidatesExpenseSectionTitle:
          "Gastos candidatos a obligacion",
        recurringCandidatesExpenseSectionDescription:
          "Gastos repetidos que puedes confirmar como compromisos futuros.",
        recurringCandidatesIncomeSectionTitle: "Ingresos frecuentes",
        recurringCandidatesIncomeSectionDescription:
          "Entradas repetidas que se mantienen como lectura analitica.",
        recurringCandidatesWeekly: "Cada semana",
        recurringCandidatesBiweekly: "Cada 15 dias",
        recurringCandidatesMonthly: "Cada mes",
        recurringCandidatesOccurrences: (count: number) =>
          count === 1 ? "1 repeticion" : `${count} repeticiones`,
        recurringCandidatesCategoryHint: (categoryName: string) =>
          `En ${categoryName}`,
        recurringCandidatesMatchDescription: (count: number) =>
          `Vimos ${count} movimientos parecidos con la misma descripcion y categoria.`,
        recurringCandidatesMatchCategoryAmount: (count: number) =>
          `Vimos ${count} movimientos sin descripcion, pero con la misma categoria y el mismo monto.`,
        recurringCandidatesIntervals: (intervals: number[]) =>
          `Se repitieron con intervalos de ${intervals.join(", ")} dias.`,
        recurringCandidatesAmountExact: (amount: string) =>
          `El monto fue exactamente ${amount} en cada repeticion.`,
        recurringCandidatesAmountStable: (
          minAmount: string,
          maxAmount: string,
        ) => `El monto se movio poco: entre ${minAmount} y ${maxAmount}.`,
        recurringCandidatesLastSeen: (dateLabel: string) =>
          `Ultima vez visto: ${dateLabel}.`,
        recurringCandidatesCompactLine: (dateLabel: string) =>
          `Ultima vez visto: ${dateLabel}.`,
        futureCashTitle: "Caja futura",
        futureCashDescription:
          "Proyeccion consolidada a 30, 60 y 90 dias basada en tu saldo actual y obligaciones confirmadas. No cambia tu saldo de hoy.",
        futureCashHelpTitle: "Como se calcula esta lectura?",
        futureCashHelpDescription:
          "Partimos de tu saldo actual consolidado registrado y restamos solo obligaciones activas confirmadas dentro de cada horizonte. No usamos inferencias, no cambiamos tu saldo actual y no tocamos Analisis.",
        futureCashSafeToSpendTitle: "Disponible para gastar en 30 dias",
        futureCashSafeToSpendDescription: (
          currentBalance: string,
          committedAmount: string,
          dateLabel: string,
        ) =>
          `Es lo que te quedaria libre para gastar si tomamos ${currentBalance} de saldo real y restamos ${committedAmount} en obligaciones confirmadas hasta ${dateLabel}.`,
        futureCashCurrentBalanceLabel: "Saldo al iniciar el periodo",
        futureCashCurrentBalanceHelpTitle: "De donde sale este saldo?",
        futureCashCurrentBalanceHelpDescription:
          "Es el saldo real con el que empieza este periodo. Solo incluye dinero ya registrado.",
        futureCashCommittedLabel: "Obligaciones de este periodo",
        futureCashCommittedHelpTitle: "Que incluye este total?",
        futureCashCommittedHelpDescription:
          "Es la suma de las obligaciones activas confirmadas que entran en este periodo. No incluye montos estimados ni gastos sin confirmar.",
        futureCashPerDayLabel: "Disponible por dia",
        futureCashPerDayHelpTitle: "Como leerlo?",
        futureCashPerDayHelpDescription:
          "Es una referencia simple de lo que tendrias disponible para gastar por dia en este periodo.",
        futureCashHorizonLabel: (days: number) => `${days} dias`,
        futureCashWindowEndLabel: (dateLabel: string) => `Hasta ${dateLabel}`,
        futureCashProjectedBalanceLabel: "Saldo proyectado",
        futureCashProjectedBalanceHelpTitle:
          "Que significa este saldo proyectado?",
        futureCashProjectedBalanceHelpDescription:
          "Es el saldo que te quedaria hasta esa fecha si mantienes tu saldo actual y cumples las obligaciones confirmadas incluidas en ese periodo.",
        futureCashCommittedLine: (amount: string) =>
          `Comprometido confirmado: ${amount}.`,
        futureCashSafeLine: (amount: string) =>
          `Disponible para gastar en este periodo: ${amount}.`,
        futureCashShortfallLine: (amount: string) =>
          `Faltante estimado: ${amount}.`,
        futureCashScheduledPaymentsLabel: (count: number) =>
          count === 1 ? "1 pago previsto." : `${count} pagos previstos.`,
        futureCashStatusCovered: "Cubierto",
        futureCashStatusTight: "Justo",
        futureCashStatusShortfall: "Faltante",
        futureCashTeaserTitle: "Caja futura",
        futureCashTeaserDescription:
          "Mantuvimos la proyeccion completa fuera de Resumen. Aqui solo ves una lectura compacta del margen a 30 dias.",
        futureCashTeaserOpen: "Abrir caja futura",
        futureCashTeaserLine: (amount: string, dateLabel: string) =>
          `Tienes ${amount} libres para gastar hasta ${dateLabel}.`,
        futureCashTeaserStatusLabel: "Disponible para gastar en 30 dias",
        upcomingObligationsTitle: "Proximos vencimientos",
        upcomingObligationsDescription:
          "Una lectura compacta de lo que vence en los proximos 5 dias, sin mezclarlo con tu saldo actual.",
        upcomingObligationsHelpTitle: "Como leer estas obligaciones?",
        upcomingObligationsHelpDescription:
          "Aqui solo ves obligaciones confirmadas con vencimiento cercano. No afectan tu dinero disponible hasta que las marcas como pagadas.",
        upcomingObligationsViewAll: "Abrir obligaciones",
        upcomingObligationsSummaryTotal: "Comprometido en ventana",
        upcomingObligationsSummaryUrgent: "Con urgencia",
        upcomingObligationsSummaryOverdue: "Vencidas",
        upcomingObligationsSummaryRisk: "Riesgo de cuenta",
        upcomingObligationsEmpty:
          "Todavia no hay obligaciones activas en la ventana de proximos vencimientos.",
        upcomingObligationsDueDate: (dateLabel: string) =>
          `Vence el ${dateLabel}.`,
        upcomingObligationsAccountRisk: (
          accountName: string,
          shortfallAmount: string,
        ) => `La cuenta ${accountName} hoy no cubre ${shortfallAmount}.`,
        upcomingObligationsNoAccount: "Sin cuenta esperada",
        upcomingObligationsUrgencyOverdue: "Vencida",
        upcomingObligationsUrgencyToday: "Vence hoy",
        upcomingObligationsUrgencySoon: "Vence pronto",
        upcomingObligationsUrgencyUpcoming: "Mas adelante",
        historyPending:
          "Completa tu perfil financiero para ver el historico mensual.",
        noHistory: "Todavia no hay movimientos para calcular el balance.",
        selectedMonthEmpty: "No hay movimientos en el mes seleccionado.",
        selectedMonthSkippedNotice: (count: number, currency: string) =>
          `${count} transacciones quedaron fuera del balance del mes porque no se pudieron convertir de forma segura a ${currency}.`,
        historySkippedNotice: (count: number, currency: string) =>
          `Hay ${count} transacciones legacy excluidas del historico porque no existe una conversion confiable hacia ${currency}.`,
      },
      analysis: {
        title: "Analisis",
        subtitle:
          "Entiende tus ingresos y gastos del mes sin mezclar movimientos entre tus cuentas.",
        heading: (monthLabel: string) => `Analisis del periodo - ${monthLabel}`,
        analysisHelpTitle: "Que veras en Analisis?",
        analysisHelpDescription:
          "Aqui solo mostramos ingresos y gastos del mes seleccionado. Las transferencias entre tus cuentas y los ajustes manuales no entran en esta vista.",
        monthLabel: "Mes",
        accountLabel: "Cuenta",
        allAccountsLabel: "Todas las cuentas",
        latestMonthHint:
          "Usa el mismo mes y cuenta para comparar mejor categorias y patrones repetidos.",
      },
      cashflow: {
        title: "Caja futura",
        subtitle:
          "Planea tu gasto con una proyeccion clara de 30, 60 y 90 dias basada en saldo real y obligaciones confirmadas.",
        helpTitle: "Que veras aqui?",
        helpDescription:
          "Esta vista separa caja futura de tu resumen diario. Parte del saldo real ya registrado y descuenta solo obligaciones activas confirmadas en cada ventana.",
        openObligations: "Abrir obligaciones",
        missingProfile:
          "Completa tu moneda base y tu zona horaria antes de usar caja futura.",
      },
      obligations: {
        title: "Obligaciones",
        subtitle:
          "Confirma pagos futuros, revisa urgencia y conviertelos en gasto real solo cuando se paguen.",
        helpTitle: "Que puedes hacer aqui?",
        helpDescription:
          "Esta vista solo muestra compromisos futuros confirmados. Los patrones recurrentes inferidos se quedan en Analisis hasta que confirmas un gasto como obligacion.",
        summaryActive: "Activas",
        summaryUrgent: "Con urgencia",
        summaryRisk: "Riesgo de cuenta",
        summaryRiskHelpTitle: "Que significa este riesgo?",
        summaryRiskHelpDescription:
          "Aqui puedes ver cuantas obligaciones activas tienen una cuenta esperada, pero hoy esa cuenta no alcanza para cubrir el monto completo.",
        openCreateModal: "Nueva obligacion",
        createFormTitle: "Nueva obligacion",
        createFormDescription:
          "Crea una obligacion manual o termina de confirmar una sugerida desde Analisis.",
        editFormTitle: "Editar obligacion",
        editFormDescription:
          "Ajusta el monto, la frecuencia, el proximo vencimiento o la cuenta esperada.",
        missingProfile:
          "Completa tu moneda base y tu zona horaria antes de gestionar obligaciones.",
        missingExpenseCategory:
          "Necesitas al menos una categoria de gasto para crear obligaciones.",
        prefillApplied:
          "Se cargo una obligacion prellenada desde Analisis. Revisala y guardala si te sirve.",
        prefillAppliedFriendly:
          "Completamos los datos con este patron detectado. Revisa y guardalo si te sirve.",
        name: "Nombre",
        namePlaceholder: "Ej: Arriendo del estudio",
        amount: "Monto esperado",
        amountPlaceholder: "Ej: 1200000",
        cadence: "Frecuencia",
        cadencePlaceholder: "Selecciona frecuencia",
        cadenceMonthly: "Cada mes",
        cadenceBiweekly: "Cada 15 dias",
        cadenceWeekly: "Cada semana",
        nextDueDate: "Proximo vencimiento",
        category: "Categoria",
        categoryPlaceholder: "Selecciona una categoria de gasto",
        expectedAccount: "Cuenta esperada",
        expectedAccountPlaceholder: "Opcional",
        noExpectedAccount: "Sin cuenta esperada",
        createAction: "Crear obligacion",
        creating: "Creando obligacion...",
        updateAction: "Guardar cambios",
        updating: "Guardando obligacion...",
        cancelEdit: "Cancelar edicion",
        activeSectionTitle: "Activas",
        activeSectionDescription:
          "Tus proximos compromisos listos para revisar, editar o marcar como pagados.",
        pausedSectionTitle: "Pausadas",
        pausedSectionDescription:
          "Compromisos que quieres conservar sin urgencias activas por ahora.",
        archivedSectionTitle: "Archivadas",
        archivedSectionDescription:
          "Obligaciones que ya no usas, pero quieres dejar como referencia.",
        emptyActive: "No hay obligaciones activas.",
        emptyPaused: "No hay obligaciones pausadas.",
        emptyArchived: "No hay obligaciones archivadas.",
        emptyState:
          "Aqui veras solo obligaciones que ya confirmaste. Puedes crear una nueva o convertir un gasto recurrente desde Analisis.",
        statusActive: "Activa",
        statusPaused: "Pausada",
        statusArchived: "Archivada",
        urgencyOverdue: "Vencida",
        urgencyToday: "Vence hoy",
        urgencySoon: "Vence pronto",
        urgencyUpcoming: "Mas adelante",
        nextDueLabel: (dateLabel: string) => `Vence el ${dateLabel}.`,
        cadenceLabel: (cadenceLabel: string) => `Frecuencia: ${cadenceLabel}.`,
        expectedAccountLabel: (accountName: string) =>
          `Cuenta esperada: ${accountName}.`,
        accountRiskLabel: (amount: string) =>
          `Hoy falta ${amount} en la cuenta esperada para cubrirla.`,
        markPaid: "Marcar pagada",
        confirmMarkPaid: "Confirmar pago",
        markingPaid: "Marcando pago...",
        paymentAccount: "Cuenta real del pago",
        paymentAccountPlaceholder: "Selecciona una cuenta",
        paymentDateTime: "Fecha y hora real",
        paymentDescription: "Descripcion del gasto",
        paymentDescriptionPlaceholder:
          "Opcional. Si lo dejas vacio se usara el nombre de la obligacion.",
        pause: "Pausar",
        reactivate: "Reactivar",
        archive: "Archivar",
        deleteTitle: "Eliminar obligacion?",
        deleteDescription: (name: string) =>
          `La obligacion "${name}" dejara de aparecer en tus proximos vencimientos. Los gastos que ya registraste seguiran en Transacciones.`,
        created: "Obligacion creada",
        updated: "Obligacion actualizada",
        paused: "Obligacion pausada",
        archived: "Obligacion archivada",
        reactivated: "Obligacion reactivada",
        markedPaid: "Obligacion marcada como pagada",
        deleted: "Obligacion eliminada",
        failedLoad: "No se pudieron cargar las obligaciones",
        failedCreate: "No se pudo crear la obligacion",
        failedUpdate: "No se pudo actualizar la obligacion",
        failedStatusUpdate: "No se pudo actualizar el estado de la obligacion",
        failedMarkPaid: "No se pudo marcar la obligacion como pagada",
        failedDelete: "No se pudo eliminar la obligacion",
        deleting: "Eliminando...",
        overdueNotice: (count: number) =>
          count === 1
            ? "Tienes 1 obligacion vencida que sigue activa."
            : `Tienes ${count} obligaciones vencidas que siguen activas.`,
        validations: {
          requiredFields:
            "Completa nombre, monto, proximo vencimiento y categoria.",
          paymentAccountRequired:
            "Selecciona la cuenta real desde la que pagaste.",
          paymentDateRequired: "Completa la fecha y hora real del pago.",
        },
        createFromCandidate: "Confirmar como obligacion",
      },
      categories: {
        title: "Categorias",
        subtitle:
          "Organiza mejor tus ingresos y gastos con categorias y grupos.",
        categoriesHelpTitle: "Para que sirven las categorias?",
        categoriesHelpDescription:
          "Te ayudan a clasificar tus ingresos y gastos para entender mejor en que gastas y de donde entra tu dinero.",
        newCardTitle: "Nueva categoria",
        newCardDescription:
          "Crea una categoria para clasificar un ingreso o un gasto.",
        name: "Nombre",
        direction: "Tipo",
        directionHelpTitle: "Que significa el tipo?",
        directionHelpDescription:
          "Define si la categoria se usa para ingresos o para gastos. Asi no mezclas dinero que entra con dinero que sale.",
        parentOptional: "Grupo (opcional)",
        parentHelpTitle: "Que es un grupo?",
        parentHelpDescription:
          "Si eliges un grupo, la nueva categoria creada se convierte en una subcategoría. Esto te ayuda a organizar mejor en qué gastaste tu dinero o de dónde provino, por ejemplo: Grupo: Hogar > Subcategoría: Mercado.",
        parentHelpDescriptionSimple:
          "Un grupo te ayuda a reunir categorias parecidas. Por ejemplo: Hogar puede agrupar Mercado, Arriendo y Servicios.",
        namePlaceholder: "Ej: Mercado",
        addCategory: "Agregar categoria",
        create: "Crear categoria",
        creating: "Creando...",
        filters: "Filtros",
        listTitle: "Categorias",
        groupedView: "Agrupadas",
        allView: "Todas",
        uncategorizedGroup: "Sin grupo",
        subcategoryLabel: "Subcategoria",
        unknownParent: "Grupo desconocido",
        subcategoriesCount: (count: number) => `${count} subcategorias`,
        categoriesCount: (count: number) => `${count} categorias`,
        loading: "Cargando...",
        empty: "No se encontraron categorias.",
        editTitle: "Editar categoria",
        save: "Guardar cambios",
        saving: "Guardando...",
        deleteTitle: "Eliminar categoria?",
        deleteDescription: (name: string) =>
          `Seguro que quieres eliminar "${name}"? Esta accion no se puede deshacer.`,
        deleted: "Categoria eliminada",
        created: "Categoria creada",
        updated: "Categoria actualizada",
        duplicateCategory: (name: string) => `Tu categoria ${name} ya existe`,
        groupCannotBecomeSubcategory:
          "No puedes agregar un grupo porque esta categoria ya es un grupo.",
        groupMustBeTopLevel:
          "Solo puedes agrupar dentro de una categoria principal.",
        groupMustMatchDirection:
          "El grupo debe tener la misma direccion que la categoria.",
        groupDirectionCannotChange:
          "No puedes cambiar la direccion de un grupo mientras tenga subcategorias.",
        failedLoad: "No se pudieron cargar las categorias",
        failedCreate: "No se pudo crear la categoria",
        failedUpdate: "No se pudo actualizar la categoria",
        failedDelete: "No se pudo eliminar la categoria",
        deleteBlockedByTransactions:
          "No puedes eliminar esta categoria porque tiene transacciones asociadas. Primero elimina esas transacciones o cambialas a otra categoria.",
        deleteBlockedBySubcategories:
          "No puedes eliminar esta categoria porque todavia tiene subcategorias.",
        ofTotal: (visible: number, total: number) => `(${visible} de ${total})`,
        pageOf: (page: number, total: number) => `Pagina ${page} de ${total}`,
        showingOfTotal: (visible: number, total: number) =>
          `Mostrando ${visible} de ${total}`,
        pageSizeLabel: (count: number) => `${count} por pagina`,
        previousPage: "Anterior",
        nextPage: "Siguiente",
        validations: {
          nameRequired: "El nombre es obligatorio",
        },
      },
      transactions: {
        title: "Transacciones",
        subtitle:
          "Registra y revisa tus ingresos y gastos del dia a dia. Los movimientos entre cuentas y los ajustes se manejan en Resumen.",
        transactionsHelpTitle: "Que entra aqui?",
        transactionsHelpDescription:
          "En esta pantalla solo van ingresos y gastos normales. Si moviste dinero entre tus cuentas o corregiste un saldo, eso se hace desde Resumen.",
        newCardTitle: "Nueva transaccion",
        newCardDescription: "Registra un ingreso o un gasto normal.",
        addTransaction: "Agregar transaccion",
        account: "Cuenta",
        category: "Categoria",
        parentCategory: "Grupo",
        amount: "Monto",
        currency: "Moneda",
        dateTime: "Fecha y hora",
        descriptionOptional: "Descripcion (opcional)",
        accountPlaceholder: "Selecciona cuenta",
        categoryPlaceholder: "Selecciona categoria",
        amountPlaceholder: "Ej: 50000",
        currencyPlaceholder: "COP",
        create: "Crear transaccion",
        creating: "Creando...",
        time: "Hora",
        filters: "Filtros",
        recentView: "Recientes",
        historyView: "Historial",
        recentListTitle: "Movimientos recientes",
        historyListTitle: "Historial completo",
        quickRangeToday: "Hoy",
        quickRangeLast7: "7 dias",
        quickRangeThisMonth: "Este mes",
        desktopView: "PC",
        mobileView: "Movil",
        moreFilters: "Mas filtros",
        summaryTitle: "Resumen de estos movimientos",
        summaryHelpTitle: "Como leer este resumen?",
        summaryHelpDescription:
          "Estos totales se calculan solo con los movimientos que ves aqui y con los filtros que tengas activos.",
        summaryTransactions: "Movimientos",
        summaryIncome: "Ingresos",
        summaryExpense: "Gastos",
        summaryBalance: "Neto",
        summaryCategories: "Categorias usadas",
        summarySkippedNotice: (count: number, currency: string) =>
          `${count} transacciones quedaron fuera de este resumen porque no se pueden llevar con seguridad a ${currency}.`,
        startDate: "Fecha inicial",
        endDate: "Fecha final",
        listTitle: "Transacciones",
        loading: "Cargando...",
        empty: "No se encontraron transacciones.",
        type: "Tipo",
        today: "Hoy",
        yesterday: "Ayer",
        pageOf: (page: number, total: number) => `Pagina ${page} de ${total}`,
        showingOfTotal: (visible: number, total: number) =>
          `Mostrando ${visible} de ${total}`,
        pageSizeLabel: (count: number) => `${count} por pagina`,
        previousPage: "Anterior",
        nextPage: "Siguiente",
        editTitle: "Editar transaccion",
        save: "Guardar cambios",
        saving: "Guardando...",
        deleteTitle: "Eliminar transaccion?",
        deleteDescription: (amount: string, description?: string) =>
          `Seguro que quieres eliminar esta transaccion de ${amount}${description ? ` - \"${description}\"` : ""}? Esta accion no se puede deshacer.`,
        created: "Transaccion creada",
        updated: "Transaccion actualizada",
        deleted: "Transaccion eliminada",
        failedLoad: "No se pudieron cargar las transacciones",
        failedCreate: "No se pudo crear la transaccion",
        failedUpdate: "No se pudo actualizar la transaccion",
        failedDelete: "No se pudo eliminar la transaccion",
        imports: {
          title: "Importar movimientos desde CSV",
          trigger: "Importar CSV",
          description:
            "Cada fila debe tener fecha y monto. Si tu archivo trae descripcion, categoria o moneda, tambien intentamos reconocerlas.",
          detectedColumnsTitle: "Columnas detectadas en este archivo",
          detectedColumnsEmpty:
            "Analiza un CSV para ver que columnas pudimos reconocer.",
          sourceHeadersTitle: "Columnas que trae tu archivo",
          detectedFieldLabels: {
            date: "Fecha",
            amount: "Monto",
            debit: "Gasto",
            credit: "Ingreso",
            description: "Descripcion",
            currency: "Moneda",
            category: "Categoria",
            type: "Tipo",
          },
          file: "Archivo CSV",
          fileHint:
            "Usa un archivo con encabezados, una sola cuenta destino por importacion y, si puedes, agrega descripcion o categoria.",
          account: "Cuenta destino",
          accountPlaceholder: "Selecciona cuenta",
          accountFallback: "Cuenta",
          defaultIncomeCategory: "Categoria para ingresos",
          defaultExpenseCategory: "Categoria para gastos",
          optionalPlaceholder: "Opcional",
          analyze: "Analizar CSV",
          analyzing: "Analizando CSV...",
          analyzed: "CSV analizado",
          recentTitle: "Importaciones recientes",
          activeSessionDescription: (count: number) =>
            count === 1
              ? "1 fila detectada en esta importacion."
              : `${count} filas detectadas en esta importacion.`,
          summaryReady: "Listas",
          summaryReview: "Requieren accion",
          summaryDuplicates: "Duplicadas",
          summaryImported: "Importadas",
          summaryIgnored: "Ignoradas",
          reviewHint:
            "Solo las filas listas crean transacciones reales cuando confirmas la importacion.",
          importReady: (count: number) =>
            count === 1
              ? "Importar 1 fila lista"
              : `Importar ${count} filas listas`,
          importing: "Importando...",
          imported: (count: number) =>
            count === 1
              ? "1 fila se convirtio en transaccion real"
              : `${count} filas se convirtieron en transacciones reales`,
          tableRow: "Fila",
          tableStatus: "Estado",
          tableReconciliation: "Reconciliacion",
          categoryPlaceholder: "Asignar categoria",
          statusReady: "Lista",
          statusNeedsReview: "Revisar",
          statusDuplicate: "Duplicada",
          statusIgnored: "Ignorada",
          statusImported: "Importada",
          ignore: "Ignorar",
          restore: "Restaurar",
          importedLabel: "Ya importada",
          noReconciliation: "Sin coincidencia todavia",
          noDescription: "Sin descripcion",
          reasonIgnoredByUser: "La ignoraste.",
          reasonMissingRequiredValues: "Faltan datos obligatorios.",
          reasonCategoryRequired:
            "Debes asignar una categoria antes de importar.",
          reasonMatchesExistingTransaction:
            "Coincide con una transaccion real existente.",
          reasonImportedIntoLedger: "Ya se importo como transaccion real.",
          reasonCurrencyMismatch:
            "La moneda no coincide con la cuenta destino.",
          reasonCategoryConflict:
            "La categoria no coincide con el ingreso o gasto detectado.",
          reasonDateInvalid: "No pudimos leer la fecha.",
          reasonAmountInvalid: "El monto debe ser mayor que cero.",
          reasonCurrencyRequired: "Falta la moneda.",
          reasonDuplicateWithinImport:
            "Coincide con otra fila de esta importacion.",
          reasonCategoryNotFound: (name: string) =>
            `No encontramos la categoria "${name}".`,
          reconciliationMatch: (
            description: string,
            amount: string,
            dateLabel: string,
          ) => `${description} | ${amount} | ${dateLabel}`,
          emptyState:
            "Todavia no hay importaciones recientes. Analiza un CSV para revisar coincidencias antes de crear transacciones reales.",
          missingCategories:
            "Crea al menos una categoria antes de importar. Cada ingreso o gasto real necesita una categoria.",
          failedLoad: "No se pudieron cargar las importaciones",
          failedAnalyze: "No se pudo analizar el CSV",
          failedUpdateItem: "No se pudo actualizar esta fila importada",
          failedCommit: "No se pudo confirmar la importacion",
          validations: {
            fileRequired: "Selecciona un archivo CSV",
            accountRequired: "Selecciona la cuenta destino",
            nothingReady: "No hay filas listas para importar",
          },
        },
        validations: {
          accountRequired: "La cuenta es obligatoria",
          categoryRequired: "La categoria es obligatoria",
          amountRequired: "El monto es obligatorio",
          amountInvalid: "El monto solo puede contener numeros",
          currencyRequired: "La moneda es obligatoria",
          dateRequired: "La fecha es obligatoria",
          descriptionRequired: "La descripcion es obligatoria",
        },
      },
      profile: {
        title: "Perfil",
        subtitle: "Administra la informacion de tu cuenta.",
        preferencesTitle: "Preferencias",
        preferencesDescription:
          "Configura idioma y apariencia de la aplicacion.",
        languageLabel: "Idioma",
        appearanceLabel: "Apariencia",
        languageEs: "Espanol",
        languageEn: "Ingles",
        themeSystem: "Sistema",
        themeLight: "Claro",
        themeDark: "Oscuro",
        infoCardTitle: "Informacion de la cuenta",
        infoCardDescription:
          "Tu nombre se guarda automaticamente. La moneda base y la zona horaria se usan en todos los analytics.",
        fullName: "Nombre completo",
        fullNamePlaceholder: "Tu nombre",
        email: "Correo",
        memberSince: "Miembro desde",
        saving: "Guardando...",
        saved: "Guardado",
        financeTitle: "Perfil financiero",
        financeCardDescription:
          "Define la moneda principal y la zona horaria que usara Dinerance para mostrar bien tus movimientos.",
        financeDescription:
          "Estos datos ayudan a que tus montos y fechas se entiendan igual en toda la app.",
        financeHelpTitle: "Para que sirve esto?",
        financeHelpDescription:
          "La moneda principal se usa para tus totales y la zona horaria ayuda a ubicar cada movimiento en el dia y el mes correctos.",
        financeSave: "Guardar perfil financiero",
        financeSaving: "Guardando perfil...",
        financeSaved: "Perfil guardado",
        baseCurrencyLabel: "Moneda principal",
        baseCurrencyPlaceholder: "COP",
        baseCurrencyHint:
          "Usaremos esta moneda para tus totales y para las cuentas nuevas en esta etapa.",
        baseCurrencyLockedHint:
          "Como ya tienes movimientos registrados, esta moneda queda fija para no alterar tu historial.",
        baseCurrencyHelpTitle: "Que es la moneda principal?",
        baseCurrencyHelpDescription:
          "Es la moneda con la que Dinerance resume tus totales. Hoy todas tus cuentas usan esa misma moneda.",
        baseCurrencyInvalid:
          "La moneda base debe ser un codigo ISO de 3 letras, por ejemplo COP o USD.",
        timezoneLabel: "Zona horaria",
        timezonePlaceholder: "America/Bogota",
        timezoneBrowserAction: "Usar la del navegador",
        timezoneHint: (browserTimeZone: string) =>
          `Puedes escribir para buscar una zona horaria o usar la detectada en este navegador: ${browserTimeZone}.`,
        timezoneExamples:
          "Ejemplos: America/Bogota, America/New_York, Europe/Madrid.",
        timezoneHelpTitle: "Por que importa la zona horaria?",
        timezoneHelpDescription:
          "Sirve para que un movimiento quede en el dia y en el mes correctos segun tu ubicacion, sobre todo cerca de la medianoche.",
        timezoneInvalid: "Selecciona una zona horaria IANA valida.",
        financialAccountsTitle: "Cuentas financieras",
        financialAccountsDescription:
          "Administra los lugares donde guardas o mueves tu dinero, por ejemplo cuenta principal, billetera o ahorro.",
        financialAccountsDefaultHint:
          "La cuenta por defecto se selecciona automaticamente cuando registras un ingreso o un gasto nuevo.",
        financialAccountsHelpTitle: "Para que sirven las cuentas?",
        financialAccountsHelpDescription:
          "Te ayudan a separar donde esta tu dinero. Asi puedes ver cuanto tienes en cada lugar y mover dinero entre cuentas sin contarlo como ingreso o gasto.",
        financialAccountsAdd: "Agregar cuenta",
        financialAccountsCreateTitle: "Nueva cuenta",
        financialAccountsEditTitle: "Editar cuenta",
        financialAccountsNameLabel: "Nombre de la cuenta",
        financialAccountsNamePlaceholder: "Ej: Billetera",
        financialAccountsDefaultBadge: "Por defecto",
        financialAccountsSetDefault: "Usar por defecto",
        financialAccountsDeleteTitle: "Eliminar cuenta?",
        financialAccountsDeleteDescription: (name: string) =>
          `Seguro que quieres eliminar la cuenta \"${name}\"? Esta accion no se puede deshacer.`,
        financialAccountsCreated: "Cuenta creada",
        financialAccountsUpdated: "Cuenta actualizada",
        financialAccountsDeleted: "Cuenta eliminada",
        financialAccountsDefaultUpdated: "Cuenta por defecto actualizada",
        financialAccountsFailedLoad: "No se pudieron cargar las cuentas",
        financialAccountsFailedCreate: "No se pudo crear la cuenta",
        financialAccountsFailedUpdate: "No se pudo actualizar la cuenta",
        financialAccountsFailedDelete: "No se pudo eliminar la cuenta",
        financialAccountsFailedSetDefault:
          "No se pudo cambiar la cuenta por defecto",
        financialAccountsNameRequired: "El nombre de la cuenta es obligatorio",
        financialAccountsCannotDeleteLast:
          "No puedes eliminar la unica cuenta financiera.",
        financialAccountsDeleteBlockedByTransactions: (count: number) =>
          count === 1
            ? "No puedes eliminar esta cuenta porque tiene 1 transaccion."
            : `No puedes eliminar esta cuenta porque tiene ${count} transacciones.`,
        financialAccountsDefaultRequired:
          "Siempre debe existir una cuenta por defecto.",
        financialAccountsNotFound: "No se encontro la cuenta financiera.",
        dangerTitle: "Zona de peligro",
        dangerDescription:
          "Desactiva tu perfil local en Dinerance sin eliminar el historial.",
        deactivateAccount: "Desactivar cuenta",
        confirmDeactivateTitle: "Desactivar tu cuenta?",
        confirmDeactivateDescription:
          "Esta accion marca tu perfil local como desactivado y oculta temporalmente tus categorias y transacciones. Si vuelves a iniciar sesion mas adelante, Dinerance reactivara la misma cuenta con esos datos.",
        confirmDeactivateButton: "Si, desactivar cuenta",
        deactivating: "Desactivando...",
        deactivated: "Cuenta desactivada",
        failedSaveName: "No se pudo guardar el nombre",
        failedSaveFinance: "No se pudo guardar la configuracion financiera",
        failedLoadTransactionPresence:
          "No se pudo verificar si ya tienes transacciones.",
        failedDeactivateAccount: "No se pudo desactivar la cuenta",
        dateLocale: "es-CO",
      },
    },
  },
  en: {
    metadata: {
      title: mainPageContent.en.seo.title,
      description: mainPageContent.en.seo.description,
      htmlLang: "en",
    },
    common: {
      loading: "Loading...",
      unexpectedError: "Unexpected error",
      mobileTableScrollHint: "Swipe to view more columns.",
      mainFinancialAccount: "Main account",
      none: "None",
      all: "All",
      clearFilters: "Clear filters",
      refresh: "Refresh",
      cancel: "Cancel",
      saveChanges: "Save changes",
      edit: "Edit",
      delete: "Delete",
      actions: "Actions",
      direction: "Direction",
      category: "Category",
      date: "Date",
      amount: "Amount",
      currency: "Currency",
      description: "Description",
      dash: "-",
      income: "Income",
      expense: "Expense",
    },
    appLayout: {
      mobileMenuTitle: "Menu",
      mobileMenuDescription: "Navigate your dashboard and manage your session.",
      nav: {
        balance: "Overview",
        cashflow: "Future cash",
        analysis: "Analysis",
        obligations: "Obligations",
        transactions: "Transactions",
        categories: "Categories",
        profile: "Profile",
      },
      obligationsAlertOpen: "Open obligations",
      obligationsAlertMixedBanner: (
        overdueCount: number,
        dueTodayCount: number,
      ) =>
        `You have ${overdueCount} ${
          overdueCount === 1
            ? "active overdue obligation"
            : "active overdue obligations"
        } and ${dueTodayCount} due today.`,
      obligationsAlertOverdueBanner: (count: number) =>
        count === 1
          ? "You have 1 overdue obligation that is still active."
          : `You have ${count} overdue obligations that are still active.`,
      obligationsAlertTodayBanner: (count: number) =>
        count === 1
          ? "You have 1 obligation due today."
          : `You have ${count} obligations due today.`,
      signOut: "Sign out",
    },
    auth: {
      login: {
        title: "Sign in",
        email: "Email",
        password: "Password",
        submit: "Sign in",
        submitting: "Signing in...",
        google: "Continue with Google",
        googleSubmitting: "Redirecting to Google...",
        orContinueWithEmail: "or continue with email",
        noAccount: "Don't have an account?",
        register: "Register",
        notRegistered: "User is not registered.",
        validations: {
          invalidEmail: "Invalid email",
          passwordRequired: "Password required",
        },
        successToast: "Signed in successfully",
      },
      register: {
        title: "Create account",
        name: "Name",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm password",
        submit: "Create account",
        submitting: "Creating account...",
        google: "Sign up with Google",
        googleSubmitting: "Redirecting to Google...",
        orContinueWithEmail: "or create your account with email",
        hasAccount: "Already have an account?",
        signIn: "Sign in",
        validations: {
          nameRequired: "Name is required",
          invalidEmail: "Invalid email",
          passwordMin: "Password must be at least 8 characters",
          confirmRequired: "Please confirm your password",
          passwordsDontMatch: "Passwords don't match",
        },
        successToast: "Account created successfully.",
        profileCreatedToast: "User profile created successfully.",
      },
    },
    pages: {
      main: mainPageContent.en,
      balance: {
        title: "Overview",
        subtitle:
          "See the money you have available today, the total across accounts, and the latest movements.",
        heading: (monthLabel: string) => `Financial summary - ${monthLabel}`,
        monthLabel: "Month",
        accountLabel: "Account",
        allAccountsLabel: "All accounts",
        allAccountsActivityLabel: "All accounts",
        currentCashTitle: "Money available today",
        currentCashDescription: (
          currency: string,
          accountName?: string | null,
        ) =>
          accountName
            ? `What you have available today in ${accountName}, in ${currency}.`
            : `What you have available today across all your accounts, in ${currency}.`,
        currentCashHelpTitle: "How does this overview work?",
        currentCashHelpDescription:
          "This shows the money you have available today. We add income, subtract expenses, and also count moves between your accounts plus manual balance adjustments.",
        currentCashDistributionTitle: "How it is split today",
        currentCashDistributionDescription:
          "A quick view of where your available money is right now.",
        currentCashDistributionHelpTitle: "How should I read this visual?",
        currentCashDistributionHelpDescription:
          "Each bar shows how much of your available money sits in one account today. It helps you spot where cash is concentrated at a glance.",
        currentCashDistributionOtherAccounts: (count: number) =>
          count === 1 ? "+1 more account" : `+${count} more accounts`,
        consolidatedBalanceLabel: "Total across your accounts",
        consolidatedBalanceHelpTitle: "What does this total mean?",
        consolidatedBalanceHelpDescription:
          "It is the sum of the money available in all your accounts. Moving money between your own accounts does not change this total.",
        selectedAccountBalanceLabel: (accountName: string) =>
          `Available in ${accountName}`,
        selectedAccountBalanceFallback: "Selected balance",
        accountsTitle: "Money by account",
        accountsDescription:
          "Tap an account to focus on its available money and latest movements.",
        accountsHelpTitle: "What counts here?",
        accountsHelpDescription:
          "Each account goes up or down with income, expenses, moves between accounts, and manual balance adjustments.",
        recentActivityTitle: "Latest movements",
        recentActivityDescription:
          "The latest changes to your available money.",
        recentActivityHelpTitle: "What will you see here?",
        recentActivityHelpDescription:
          "This list includes income, expenses, moves between accounts, and manual adjustments because they all change your available money. Analysis only shows monthly income and expenses.",
        recentActivityEmpty: "There is no cash activity to show yet.",
        actionsTitle: "Active accounts",
        actionsDescription:
          "Move money between accounts or correct a balance without mixing it into monthly analysis.",
        addTransfer: "Move between accounts",
        addAdjustment: "Adjust balance",
        transferTitle: "Move between accounts",
        transferDescription:
          "Move money from one account to another. This does not count as income or expense.",
        transferFrom: "Source account",
        transferTo: "Destination account",
        adjustmentTitle: "Adjust balance",
        adjustmentDescription:
          "Use this if the real amount of money does not match the app, or to record your starting balance.",
        adjustmentType: "Why are you doing this?",
        adjustmentTypeOpening: "Starting balance",
        adjustmentTypeCorrection: "Fix a difference",
        adjustmentTypeOpeningHelpTitle: "When should you use starting balance?",
        adjustmentTypeOpeningHelpDescription:
          "Use it when an account already had money before you started using Dinerance. It records where that account starts, without counting it as income for the month.",
        adjustmentTypeCorrectionHelpTitle: "When should you fix a difference?",
        adjustmentTypeCorrectionHelpDescription:
          "Use it when the real account balance does not match the app. It lets you add or subtract the difference so today's balance matches reality.",
        adjustmentDirection: "What happened to the money?",
        adjustmentDirectionIn: "Money came in",
        adjustmentDirectionOut: "Money went out",
        createTransfer: "Save movement",
        creatingTransfer: "Saving movement...",
        createAdjustment: "Save adjustment",
        creatingAdjustment: "Creating adjustment...",
        transferCreated: "Transfer created",
        adjustmentCreated: "Adjustment created",
        transferDeleted: "Transfer deleted",
        adjustmentDeleted: "Adjustment deleted",
        failedLoadLedger: "Failed to load your overview",
        failedCreateTransfer: "Failed to create transfer",
        failedCreateAdjustment: "Failed to create adjustment",
        failedDeleteTransfer: "Failed to delete transfer",
        failedDeleteAdjustment: "Failed to delete adjustment",
        failedLoadUpcomingObligations: "Failed to load upcoming obligations",
        failedLoadCashflowForecast: "Failed to load your future cash view",
        emptyStateTitle: "Start recording your real money",
        emptyStateDescription:
          "This overview is powered by income, expenses, transfers, and adjustments.",
        distinctAccountsRequired: "You must choose two different accounts",
        deleteTransferTitle: "Delete transfer?",
        deleteTransferDescription: (description?: string | null) =>
          description
            ? `Both legs of the transfer \"${description}\" will be deleted.`
            : "Both legs of this transfer will be deleted.",
        deleteAdjustmentTitle: "Delete adjustment?",
        deleteAdjustmentDescription: (description?: string | null) =>
          description
            ? `The adjustment \"${description}\" will be deleted.`
            : "This adjustment will be deleted.",
        activityTransferLabel: "Between accounts",
        activityAdjustmentLabel: "Manual adjustment",
        activityIncomingLabel: "Inflow",
        activityOutgoingLabel: "Outflow",
        onboardingCashTitle:
          "Complete your profile to unlock your available money",
        onboardingCashDescription:
          "Set your base currency and time zone before using this overview.",
        latestMonthHint:
          "Without a filter, the latest month with activity is shown.",
        currentCardDescription: (
          currency: string,
          accountName?: string | null,
        ) =>
          accountName
            ? `View of income, expenses, and balance in ${currency} for ${accountName}.`
            : `Consolidated view of income, expenses, and balance in ${currency}.`,
        currentCardPendingDescription:
          "Complete your financial profile to unlock coherent analytics in your base currency.",
        categoryBreakdownTitle: "Category breakdown",
        categoryBreakdownDescription:
          "See which categories held most of your income or expenses in the selected month.",
        categoryBreakdownHelpTitle: "How do I read this breakdown?",
        categoryBreakdownHelpDescription:
          "This groups only income or only expenses from the selected month. Moves between your accounts and manual adjustments are not included here.",
        categoryBreakdownExpenseTab: "Expenses",
        categoryBreakdownIncomeTab: "Income",
        categoryBreakdownExpenseTotal: "Total expenses",
        categoryBreakdownIncomeTotal: "Total income",
        categoryBreakdownCategoriesCount: (count: number) =>
          `${count} categories in this breakdown.`,
        categoryBreakdownTransactionsCount: (count: number) =>
          count === 1 ? "1 transaction" : `${count} transactions`,
        categoryBreakdownEmptyExpense:
          "There are no expenses in the selected month.",
        categoryBreakdownEmptyIncome:
          "There is no income in the selected month.",
        categoryBreakdownSkippedNotice: (count: number, currency: string) =>
          `${count} transactions were excluded from this breakdown because they could not be converted safely to ${currency}.`,
        onboardingTitle: "Set up your balance",
        onboardingDescription:
          "Complete these four steps to start seeing your monthly balance with consistent data.",
        onboardingBaseCurrencyStepTitle: "Choose base currency",
        onboardingBaseCurrencyStepDescription:
          "It will be the fixed currency for your account and all totals.",
        onboardingTimeZoneStepTitle: "Choose time zone",
        onboardingTimeZoneStepDescription:
          "We use it to place each transaction in the correct day and month.",
        onboardingCategoryStepTitle: "Create a category",
        onboardingCategoryStepDescription:
          "Organize your income or expenses before recording transactions.",
        onboardingTransactionStepTitle: "Record a transaction",
        onboardingTransactionStepDescription:
          "Add your first movement so the balance can start calculating.",
        onboardingCompleted: "Completed",
        onboardingPending: "Pending",
        onboardingProfilePromptTitle: "Complete your financial profile",
        onboardingProfilePromptDescription:
          "Set your base currency and time zone to record transactions and view analytics consistently from the start.",
        onboardingCategoryPromptTitle: "Create your first category",
        onboardingCategoryPromptDescription:
          "Create at least one category to start organizing your activity.",
        onboardingTransactionPromptTitle: "Record your first transaction",
        onboardingTransactionPromptDescription:
          "With your profile and categories ready, add a transaction to start seeing results.",
        historyTitle: "Monthly balance",
        historyDescription: "Every month with recorded activity.",
        recentTransactionsTitle: "Recent activity",
        recentTransactionsDescription:
          "Latest transactions from the selected month.",
        recentTransactionsEmpty:
          "There is no activity in the selected month to show here.",
        recurringCandidatesTitle: "Detected recurring patterns",
        recurringCandidatesDescription:
          "Inferences from recent history. Expenses can be confirmed as obligations; income stays as analytical context.",
        recurringCandidatesHelpTitle: "How should I read these patterns?",
        recurringCandidatesHelpDescription:
          "These are inferences based on similar movements we saw repeating. They are not confirmed commitments until you turn an expense into an obligation.",
        recurringCandidatesEmpty:
          "We have not found recurring patterns with enough evidence yet.",
        recurringCandidatesViewAll: "Open analysis",
        recurringCandidatesIncome: "Frequent income",
        recurringCandidatesExpense: "Frequent expense",
        recurringCandidatesInferred: "Inferred",
        recurringCandidatesConfirmed: "Already confirmed",
        recurringCandidatesExpenseSectionTitle:
          "Expense candidates for obligations",
        recurringCandidatesExpenseSectionDescription:
          "Repeated expenses you can confirm as future commitments.",
        recurringCandidatesIncomeSectionTitle: "Frequent income",
        recurringCandidatesIncomeSectionDescription:
          "Repeated inflows that remain analytical context.",
        recurringCandidatesWeekly: "Every week",
        recurringCandidatesBiweekly: "Every 15 days",
        recurringCandidatesMonthly: "Every month",
        recurringCandidatesOccurrences: (count: number) =>
          count === 1 ? "1 repeat" : `${count} repeats`,
        recurringCandidatesCategoryHint: (categoryName: string) =>
          `In ${categoryName}`,
        recurringCandidatesMatchDescription: (count: number) =>
          `We found ${count} similar transactions with the same description and category.`,
        recurringCandidatesMatchCategoryAmount: (count: number) =>
          `We found ${count} transactions without description, but with the same category and exact amount.`,
        recurringCandidatesIntervals: (intervals: number[]) =>
          `They repeated with intervals of ${intervals.join(", ")} days.`,
        recurringCandidatesAmountExact: (amount: string) =>
          `The amount was exactly ${amount} on each repeat.`,
        recurringCandidatesAmountStable: (
          minAmount: string,
          maxAmount: string,
        ) => `The amount stayed close, between ${minAmount} and ${maxAmount}.`,
        recurringCandidatesLastSeen: (dateLabel: string) =>
          `Last seen: ${dateLabel}.`,
        recurringCandidatesCompactLine: (dateLabel: string) =>
          `Last seen: ${dateLabel}.`,
        futureCashTitle: "Future cash",
        futureCashDescription:
          "Consolidated 30, 60, and 90 day projection based on your current balance and confirmed obligations. It does not change your money today.",
        futureCashHelpTitle: "How is this calculated?",
        futureCashHelpDescription:
          "We start from the ledger's current consolidated balance and subtract only confirmed active obligations inside each horizon. We do not use inferences, we do not change today's balance, and we do not touch Analysis.",
        futureCashSafeToSpendTitle: "Safe-to-spend in 30 days",
        futureCashSafeToSpendDescription: (
          currentBalance: string,
          committedAmount: string,
          dateLabel: string,
        ) =>
          `We take ${currentBalance} of real cash and subtract ${committedAmount} in confirmed obligations through ${dateLabel}.`,
        futureCashCurrentBalanceLabel: "Current real balance",
        futureCashCurrentBalanceHelpTitle: "What does this balance represent?",
        futureCashCurrentBalanceHelpDescription:
          "This is your consolidated balance observed today in the ledger. It only includes money already recorded as real.",
        futureCashCommittedLabel: "Confirmed obligations",
        futureCashCommittedHelpTitle: "What is included here?",
        futureCashCommittedHelpDescription:
          "This is the sum of confirmed active obligations due inside this horizon. It excludes inferences and unconfirmed future spending.",
        futureCashPerDayLabel: "Room per day",
        futureCashPerDayHelpTitle: "How should I read this room?",
        futureCashPerDayHelpDescription:
          "It is a simple reference: available-to-spend in this window divided by the horizon days. It is not an automatic budget.",
        futureCashHorizonLabel: (days: number) => `${days} days`,
        futureCashWindowEndLabel: (dateLabel: string) => `Through ${dateLabel}`,
        futureCashProjectedBalanceLabel: "Projected balance",
        futureCashProjectedBalanceHelpTitle:
          "What does this projected balance mean?",
        futureCashProjectedBalanceHelpDescription:
          "This is the balance you would have left at the end of the window if your current balance holds and the confirmed obligations in that horizon are met.",
        futureCashCommittedLine: (amount: string) =>
          `Confirmed committed outflow: ${amount}.`,
        futureCashSafeLine: (amount: string) =>
          `Safe-to-spend in this window: ${amount}.`,
        futureCashShortfallLine: (amount: string) =>
          `Estimated shortfall: ${amount}.`,
        futureCashScheduledPaymentsLabel: (count: number) =>
          count === 1 ? "1 scheduled payment." : `${count} scheduled payments.`,
        futureCashStatusCovered: "Covered",
        futureCashStatusTight: "Tight",
        futureCashStatusShortfall: "Shortfall",
        futureCashTeaserTitle: "Future cash",
        futureCashTeaserDescription:
          "We kept the full projection outside Overview. Here you only see a compact read of your 30 day room.",
        futureCashTeaserOpen: "Open future cash",
        futureCashTeaserLine: (amount: string, dateLabel: string) =>
          `You have ${amount} free to spend through ${dateLabel}.`,
        futureCashTeaserStatusLabel: "Safe-to-spend in 30 days",
        upcomingObligationsTitle: "Upcoming obligations",
        upcomingObligationsDescription:
          "A compact read of what is due in the next 5 days without mixing it into your current balance.",
        upcomingObligationsHelpTitle: "How should I read these obligations?",
        upcomingObligationsHelpDescription:
          "These are confirmed obligations with a close due date. They do not affect your available money until you mark them as paid.",
        upcomingObligationsViewAll: "Open obligations",
        upcomingObligationsSummaryTotal: "Committed in window",
        upcomingObligationsSummaryUrgent: "Urgent",
        upcomingObligationsSummaryOverdue: "Overdue",
        upcomingObligationsSummaryRisk: "Account risk",
        upcomingObligationsEmpty:
          "There are no active obligations inside the upcoming window yet.",
        upcomingObligationsDueDate: (dateLabel: string) =>
          `Due on ${dateLabel}.`,
        upcomingObligationsAccountRisk: (
          accountName: string,
          shortfallAmount: string,
        ) =>
          `The account ${accountName} does not currently cover ${shortfallAmount}.`,
        upcomingObligationsNoAccount: "No expected account",
        upcomingObligationsUrgencyOverdue: "Overdue",
        upcomingObligationsUrgencyToday: "Due today",
        upcomingObligationsUrgencySoon: "Due soon",
        upcomingObligationsUrgencyUpcoming: "Later",
        historyPending:
          "Complete your financial profile to start seeing monthly history.",
        noHistory: "There is no activity yet to calculate the balance.",
        selectedMonthEmpty: "There is no activity in the selected month.",
        selectedMonthSkippedNotice: (count: number, currency: string) =>
          `${count} transactions were excluded from this month's balance because they could not be converted safely to ${currency}.`,
        historySkippedNotice: (count: number, currency: string) =>
          `There are ${count} legacy transactions excluded from history because no reliable conversion to ${currency} exists.`,
      },
      analysis: {
        title: "Analysis",
        subtitle:
          "Understand your monthly income and expenses without mixing in account-to-account moves.",
        heading: (monthLabel: string) => `Period analysis - ${monthLabel}`,
        analysisHelpTitle: "What will you see in Analysis?",
        analysisHelpDescription:
          "This view only shows income and expenses for the selected month. Moves between your own accounts and manual adjustments stay out of this section.",
        monthLabel: "Month",
        accountLabel: "Account",
        allAccountsLabel: "All accounts",
        latestMonthHint:
          "Use the same month and account to compare categories and repeating patterns more easily.",
      },
      cashflow: {
        title: "Future cash",
        subtitle:
          "Plan your spending with a clear 30, 60, and 90 day projection based on real balance and confirmed obligations.",
        helpTitle: "What do you see here?",
        helpDescription:
          "This view separates future cash from your daily overview. It starts from the ledger's real balance and subtracts only confirmed active obligations inside each window.",
        openObligations: "Open obligations",
        missingProfile:
          "Complete your base currency and time zone before using future cash.",
      },
      obligations: {
        title: "Obligations",
        subtitle:
          "Confirm future bills, review urgency, and turn them into real expenses only when they are paid.",
        helpTitle: "What can you do here?",
        helpDescription:
          "This view only shows confirmed future commitments. Inferred recurring patterns stay in Analysis until you confirm an expense as an obligation.",
        summaryActive: "Active",
        summaryUrgent: "Urgent",
        summaryRisk: "Account risk",
        summaryRiskHelpTitle: "What does this risk mean?",
        summaryRiskHelpDescription:
          "Here you can see how many active obligations have an expected account whose current balance is not enough to cover the full amount today.",
        openCreateModal: "New obligation",
        createFormTitle: "New obligation",
        createFormDescription:
          "Create a manual obligation or finish confirming a suggestion from Analysis.",
        editFormTitle: "Edit obligation",
        editFormDescription:
          "Adjust the amount, cadence, next due date, or expected account.",
        missingProfile:
          "Complete your base currency and time zone before managing obligations.",
        missingExpenseCategory:
          "You need at least one expense category before creating obligations.",
        prefillApplied:
          "A prefilled obligation was loaded from Analysis. Review it and save it if it looks right.",
        prefillAppliedFriendly:
          "We filled this form with a detected pattern. Review it and save it if it matches what you want.",
        name: "Name",
        namePlaceholder: "e.g. Studio rent",
        amount: "Expected amount",
        amountPlaceholder: "e.g. 1200000",
        cadence: "Cadence",
        cadencePlaceholder: "Select cadence",
        cadenceMonthly: "Every month",
        cadenceBiweekly: "Every 15 days",
        cadenceWeekly: "Every week",
        nextDueDate: "Next due date",
        category: "Category",
        categoryPlaceholder: "Select an expense category",
        expectedAccount: "Expected account",
        expectedAccountPlaceholder: "Optional",
        noExpectedAccount: "No expected account",
        createAction: "Create obligation",
        creating: "Creating obligation...",
        updateAction: "Save changes",
        updating: "Saving obligation...",
        cancelEdit: "Cancel edit",
        activeSectionTitle: "Active",
        activeSectionDescription:
          "Your next commitments, ready to review, edit, or mark as paid.",
        pausedSectionTitle: "Paused",
        pausedSectionDescription:
          "Commitments you want to keep around without active urgency for now.",
        archivedSectionTitle: "Archived",
        archivedSectionDescription:
          "Obligations you no longer use, but still want as reference.",
        emptyActive: "There are no active obligations.",
        emptyPaused: "There are no paused obligations.",
        emptyArchived: "There are no archived obligations.",
        emptyState:
          "You will only see obligations you already confirmed here. Create a new one or convert a recurring expense from Analysis.",
        statusActive: "Active",
        statusPaused: "Paused",
        statusArchived: "Archived",
        urgencyOverdue: "Overdue",
        urgencyToday: "Due today",
        urgencySoon: "Due soon",
        urgencyUpcoming: "Later",
        nextDueLabel: (dateLabel: string) => `Due on ${dateLabel}.`,
        cadenceLabel: (cadenceLabel: string) => `Cadence: ${cadenceLabel}.`,
        expectedAccountLabel: (accountName: string) =>
          `Expected account: ${accountName}.`,
        accountRiskLabel: (amount: string) =>
          `This account is currently short by ${amount}.`,
        markPaid: "Mark paid",
        confirmMarkPaid: "Confirm payment",
        markingPaid: "Marking payment...",
        paymentAccount: "Actual payment account",
        paymentAccountPlaceholder: "Select an account",
        paymentDateTime: "Actual date and time",
        paymentDescription: "Expense description",
        paymentDescriptionPlaceholder:
          "Optional. If you leave it empty, the obligation name will be used.",
        pause: "Pause",
        reactivate: "Reactivate",
        archive: "Archive",
        deleteTitle: "Delete obligation?",
        deleteDescription: (name: string) =>
          `The obligation \"${name}\" will stop appearing in upcoming due dates. Any expense you already recorded will stay in Transactions.`,
        created: "Obligation created",
        updated: "Obligation updated",
        paused: "Obligation paused",
        archived: "Obligation archived",
        reactivated: "Obligation reactivated",
        markedPaid: "Obligation marked as paid",
        deleted: "Obligation deleted",
        failedLoad: "Failed to load obligations",
        failedCreate: "Failed to create obligation",
        failedUpdate: "Failed to update obligation",
        failedStatusUpdate: "Failed to update obligation status",
        failedMarkPaid: "Failed to mark the obligation as paid",
        failedDelete: "Failed to delete obligation",
        deleting: "Deleting...",
        overdueNotice: (count: number) =>
          count === 1
            ? "You have 1 overdue obligation that is still active."
            : `You have ${count} overdue obligations that are still active.`,
        validations: {
          requiredFields:
            "Complete the name, amount, next due date, and category.",
          paymentAccountRequired:
            "Select the real account you used for this payment.",
          paymentDateRequired: "Complete the real payment date and time.",
        },
        createFromCandidate: "Confirm as obligation",
      },
      categories: {
        title: "Categories",
        subtitle:
          "Organize your income and expenses with categories and groups.",
        categoriesHelpTitle: "What are categories for?",
        categoriesHelpDescription:
          "They help you classify income and expenses so it is easier to understand where your money goes and where it comes from.",
        newCardTitle: "New category",
        newCardDescription: "Create a category for an income or an expense.",
        name: "Name",
        direction: "Type",
        directionHelpTitle: "What does the type mean?",
        directionHelpDescription:
          "Choose whether the category is for income or expenses. This keeps money coming in separate from money going out.",
        parentOptional: "Group (optional)",
        parentHelpTitle: "What is a group?",
        parentHelpDescription:
          "If you choose a group, this category becomes a subcategory. Use it to organize where your money went or where it came from, for example: Home > Groceries.",
        parentHelpDescriptionSimple:
          "A group helps you gather similar categories. For example: Home can group Groceries, Rent, and Utilities.",
        namePlaceholder: "e.g. Groceries",
        addCategory: "Add category",
        create: "Create category",
        creating: "Creating...",
        filters: "Filters",
        listTitle: "Categories",
        groupedView: "Grouped",
        allView: "All",
        uncategorizedGroup: "No group",
        subcategoryLabel: "Subcategory",
        unknownParent: "Unknown group",
        subcategoriesCount: (count: number) => `${count} subcategories`,
        categoriesCount: (count: number) => `${count} categories`,
        loading: "Loading...",
        empty: "No categories found.",
        editTitle: "Edit category",
        save: "Save changes",
        saving: "Saving...",
        deleteTitle: "Delete category?",
        deleteDescription: (name: string) =>
          `Are you sure you want to delete \"${name}\"? This action cannot be undone.`,
        deleted: "Category deleted",
        created: "Category created",
        updated: "Category updated",
        duplicateCategory: (name: string) =>
          `Your category ${name} already exists`,
        groupCannotBecomeSubcategory:
          "You cannot assign a group because this category already acts as a group.",
        groupMustBeTopLevel: "You can only group inside a top-level category.",
        groupMustMatchDirection:
          "The group must have the same direction as the category.",
        groupDirectionCannotChange:
          "You cannot change a group's direction while it has subcategories.",
        failedLoad: "Failed to load categories",
        failedCreate: "Failed to create category",
        failedUpdate: "Failed to update category",
        failedDelete: "Failed to delete category",
        deleteBlockedByTransactions:
          "You cannot delete this category because it has related transactions. First delete those transactions or move them to another category.",
        deleteBlockedBySubcategories:
          "You cannot delete this category because it still has subcategories.",
        ofTotal: (visible: number, total: number) => `(${visible} of ${total})`,
        pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
        showingOfTotal: (visible: number, total: number) =>
          `Showing ${visible} of ${total}`,
        pageSizeLabel: (count: number) => `${count} per page`,
        previousPage: "Previous",
        nextPage: "Next",
        validations: {
          nameRequired: "Name is required",
        },
      },
      transactions: {
        title: "Transactions",
        subtitle:
          "Record and review your day-to-day income and expenses. Account-to-account moves and balance adjustments live in Overview.",
        transactionsHelpTitle: "What belongs here?",
        transactionsHelpDescription:
          "This screen is only for regular income and expenses. If you moved money between your own accounts or corrected a balance, do that from Overview.",
        newCardTitle: "New transaction",
        newCardDescription: "Record a regular income or expense.",
        addTransaction: "Add transaction",
        account: "Account",
        category: "Category",
        parentCategory: "Group",
        amount: "Amount",
        currency: "Currency",
        dateTime: "Date & time",
        descriptionOptional: "Description (optional)",
        accountPlaceholder: "Select account",
        categoryPlaceholder: "Select category",
        amountPlaceholder: "e.g. 50000",
        currencyPlaceholder: "COP",
        create: "Create transaction",
        creating: "Creating...",
        time: "Time",
        filters: "Filters",
        recentView: "Recent",
        historyView: "History",
        recentListTitle: "Recent activity",
        historyListTitle: "Full history",
        quickRangeToday: "Today",
        quickRangeLast7: "7 days",
        quickRangeThisMonth: "This month",
        desktopView: "Desktop",
        mobileView: "Mobile",
        moreFilters: "More filters",
        summaryTitle: "Summary of these movements",
        summaryHelpTitle: "How should I read this summary?",
        summaryHelpDescription:
          "These totals are calculated only from the movements shown here and the filters you currently have active.",
        summaryTransactions: "Transactions",
        summaryIncome: "Income",
        summaryExpense: "Expenses",
        summaryBalance: "Net",
        summaryCategories: "Categories used",
        summarySkippedNotice: (count: number, currency: string) =>
          `${count} transactions were excluded from this summary because they cannot be mapped safely to ${currency}.`,
        startDate: "Start date",
        endDate: "End date",
        listTitle: "Transactions",
        loading: "Loading...",
        empty: "No transactions found.",
        type: "Type",
        today: "Today",
        yesterday: "Yesterday",
        pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
        showingOfTotal: (visible: number, total: number) =>
          `Showing ${visible} of ${total}`,
        pageSizeLabel: (count: number) => `${count} per page`,
        previousPage: "Previous",
        nextPage: "Next",
        editTitle: "Edit transaction",
        save: "Save changes",
        saving: "Saving...",
        deleteTitle: "Delete transaction?",
        deleteDescription: (amount: string, description?: string) =>
          `Are you sure you want to delete this transaction of ${amount}${description ? ` - \"${description}\"` : ""}? This action cannot be undone.`,
        created: "Transaction created",
        updated: "Transaction updated",
        deleted: "Transaction deleted",
        failedLoad: "Failed to load transactions",
        failedCreate: "Failed to create transaction",
        failedUpdate: "Failed to update transaction",
        failedDelete: "Failed to delete transaction",
        imports: {
          title: "Import transactions from CSV",
          trigger: "Import CSV",
          description:
            "Each row should include a date and an amount. If the file also includes a description, category, or currency, we try to recognize them too.",
          detectedColumnsTitle: "Columns detected in this file",
          detectedColumnsEmpty:
            "Analyze a CSV to see which headers the system recognized.",
          sourceHeadersTitle: "Original file headers",
          detectedFieldLabels: {
            date: "Date",
            amount: "Amount",
            debit: "Debit",
            credit: "Credit",
            description: "Description",
            currency: "Currency",
            category: "Category",
            type: "Type",
          },
          file: "CSV file",
          fileHint:
            "Use one file with headers, one destination account per import, and include a description or category when possible.",
          account: "Destination account",
          accountPlaceholder: "Select account",
          accountFallback: "Account",
          defaultIncomeCategory: "Default income category",
          defaultExpenseCategory: "Default expense category",
          optionalPlaceholder: "Optional",
          analyze: "Analyze CSV",
          analyzing: "Analyzing CSV...",
          analyzed: "CSV analyzed",
          recentTitle: "Recent imports",
          activeSessionDescription: (count: number) =>
            count === 1
              ? "1 row detected in this import."
              : `${count} rows detected in this import.`,
          summaryReady: "Ready",
          summaryReview: "Needs action",
          summaryDuplicates: "Duplicates",
          summaryImported: "Imported",
          summaryIgnored: "Ignored",
          reviewHint:
            "Only rows marked as ready create real transactions when you confirm the import.",
          importReady: (count: number) =>
            count === 1 ? "Import 1 ready row" : `Import ${count} ready rows`,
          importing: "Importing...",
          imported: (count: number) =>
            count === 1
              ? "1 row became a real transaction"
              : `${count} rows became real transactions`,
          tableRow: "Row",
          tableStatus: "Status",
          tableReconciliation: "Reconciliation",
          categoryPlaceholder: "Assign category",
          statusReady: "Ready",
          statusNeedsReview: "Review",
          statusDuplicate: "Duplicate",
          statusIgnored: "Ignored",
          statusImported: "Imported",
          ignore: "Ignore",
          restore: "Restore",
          importedLabel: "Already imported",
          noReconciliation: "No match yet",
          noDescription: "No description",
          reasonIgnoredByUser: "Ignored by you.",
          reasonMissingRequiredValues: "Required values are missing.",
          reasonCategoryRequired: "Choose a category before importing.",
          reasonMatchesExistingTransaction:
            "Matches an existing real transaction.",
          reasonImportedIntoLedger:
            "Already imported as a real transaction.",
          reasonCurrencyMismatch:
            "The currency does not match the destination account.",
          reasonCategoryConflict:
            "The category does not match the detected income or expense.",
          reasonDateInvalid: "We could not read the date.",
          reasonAmountInvalid: "The amount must be greater than zero.",
          reasonCurrencyRequired: "Currency is required.",
          reasonDuplicateWithinImport:
            "Matches another row in this import.",
          reasonCategoryNotFound: (name: string) =>
            `We could not find the category "${name}".`,
          reconciliationMatch: (
            description: string,
            amount: string,
            dateLabel: string,
          ) => `${description} | ${amount} | ${dateLabel}`,
          emptyState:
            "There are no recent imports yet. Analyze a CSV to review matches before creating real transactions.",
          missingCategories:
            "Create at least one category before importing. Every real income or expense still needs a category.",
          failedLoad: "Failed to load imports",
          failedAnalyze: "Failed to analyze the CSV",
          failedUpdateItem: "Failed to update this imported row",
          failedCommit: "Failed to confirm the import",
          validations: {
            fileRequired: "Select a CSV file",
            accountRequired: "Select the destination account",
            nothingReady: "There are no ready rows to import",
          },
        },
        validations: {
          accountRequired: "Account is required",
          categoryRequired: "Category is required",
          amountRequired: "Amount is required",
          amountInvalid: "Amount can only contain numbers",
          currencyRequired: "Currency is required",
          dateRequired: "Date is required",
          descriptionRequired: "Description is required",
        },
      },
      profile: {
        title: "Profile",
        subtitle: "Manage your account information.",
        preferencesTitle: "Preferences",
        preferencesDescription: "Configure app language and appearance.",
        languageLabel: "Language",
        appearanceLabel: "Appearance",
        languageEs: "Spanish",
        languageEn: "English",
        themeSystem: "System",
        themeLight: "Light",
        themeDark: "Dark",
        infoCardTitle: "Account information",
        infoCardDescription:
          "Your name saves automatically. Base currency and time zone drive all analytics.",
        fullName: "Full name",
        fullNamePlaceholder: "Your name",
        email: "Email",
        memberSince: "Member since",
        saving: "Saving...",
        saved: "Saved",
        financeTitle: "Financial profile",
        financeCardDescription:
          "Set the main currency and time zone Dinerance uses to show your money correctly.",
        financeDescription:
          "These settings help every amount and date mean the same thing across the app.",
        financeHelpTitle: "What is this for?",
        financeHelpDescription:
          "Your main currency is used for totals, and your time zone helps place each movement in the correct day and month.",
        financeSave: "Save financial profile",
        financeSaving: "Saving profile...",
        financeSaved: "Profile saved",
        baseCurrencyLabel: "Main currency",
        baseCurrencyPlaceholder: "USD",
        baseCurrencyHint:
          "We use this currency for your totals and for new accounts.",
        baseCurrencyLockedHint:
          "Because you already have recorded activity, this currency is now locked to preserve your history.",
        baseCurrencyHelpTitle: "What is the main currency?",
        baseCurrencyHelpDescription:
          "It is the currency Dinerance uses to summarize your totals. Today all of your accounts use that same currency.",
        baseCurrencyInvalid:
          "Base currency must be a 3-letter ISO code, for example USD or COP.",
        timezoneLabel: "Time zone",
        timezonePlaceholder: "America/New_York",
        timezoneBrowserAction: "Use browser time zone",
        timezoneHint: (browserTimeZone: string) =>
          `You can type to search for a time zone or reuse the one detected in this browser: ${browserTimeZone}.`,
        timezoneExamples:
          "Examples: America/Bogota, America/New_York, Europe/Madrid.",
        timezoneHelpTitle: "Why does the time zone matter?",
        timezoneHelpDescription:
          "It makes sure a movement lands on the correct day and month for your location, especially around midnight.",
        timezoneInvalid: "Select a valid IANA time zone.",
        financialAccountsTitle: "Financial accounts",
        financialAccountsDescription:
          "Manage the places where your money lives, such as your main account, wallet, or savings.",
        financialAccountsDefaultHint:
          "The default account is selected automatically when you record a new income or expense.",
        financialAccountsHelpTitle: "What are accounts for?",
        financialAccountsHelpDescription:
          "They help you separate where your money is. That lets you see how much you have in each place and move money between accounts without counting it as income or expense.",
        financialAccountsAdd: "Add account",
        financialAccountsCreateTitle: "New account",
        financialAccountsEditTitle: "Edit account",
        financialAccountsNameLabel: "Account name",
        financialAccountsNamePlaceholder: "e.g. Wallet",
        financialAccountsDefaultBadge: "Default",
        financialAccountsSetDefault: "Set default",
        financialAccountsDeleteTitle: "Delete account?",
        financialAccountsDeleteDescription: (name: string) =>
          `Are you sure you want to delete the account \"${name}\"? This action cannot be undone.`,
        financialAccountsCreated: "Account created",
        financialAccountsUpdated: "Account updated",
        financialAccountsDeleted: "Account deleted",
        financialAccountsDefaultUpdated: "Default account updated",
        financialAccountsFailedLoad: "Failed to load accounts",
        financialAccountsFailedCreate: "Failed to create account",
        financialAccountsFailedUpdate: "Failed to update account",
        financialAccountsFailedDelete: "Failed to delete account",
        financialAccountsFailedSetDefault:
          "Failed to update the default account",
        financialAccountsNameRequired: "Account name is required",
        financialAccountsCannotDeleteLast:
          "You cannot delete the only financial account.",
        financialAccountsDeleteBlockedByTransactions: (count: number) =>
          count === 1
            ? "You cannot delete this account because it has 1 transaction."
            : `You cannot delete this account because it has ${count} transactions.`,
        financialAccountsDefaultRequired:
          "A default financial account is always required.",
        financialAccountsNotFound: "Financial account not found.",
        dangerTitle: "Danger zone",
        dangerDescription:
          "Deactivate your local Dinerance profile without purging its history.",
        deactivateAccount: "Deactivate account",
        confirmDeactivateTitle: "Deactivate your account?",
        confirmDeactivateDescription:
          "This marks your local profile as deactivated and temporarily hides your categories and transactions. If you sign in again later, Dinerance will reactivate the same account with that data.",
        confirmDeactivateButton: "Yes, deactivate account",
        deactivating: "Deactivating...",
        deactivated: "Account deactivated",
        failedSaveName: "Failed to save name",
        failedSaveFinance: "Failed to save financial settings",
        failedLoadTransactionPresence:
          "Failed to verify whether you already have transactions.",
        failedDeactivateAccount: "Failed to deactivate account",
        dateLocale: "en-US",
      },
    },
  },
} as const;

export type SiteText = (typeof siteTexts)[SiteLocale];

export function getSiteText(locale: SiteLocale = defaultSiteLocale): SiteText {
  return siteTexts[locale] ?? siteTexts[defaultSiteLocale];
}
