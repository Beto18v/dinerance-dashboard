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
      dashboard: "Dashboard",
      signIn: "Iniciar sesion",
      logoAlt: "Dinerance",
    },
    hero: {
      badge: "Finanzas personales",
      title: "Controla tus finanzas",
      accent: "con claridad total",
      description: "Ve exactamente en qué se va tu dinero, sin complicaciones.",
      ctaAuthenticated: "Ir al dashboard",
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
        balance: "Balance",
        transactions: "Transacciones",
        categories: "Categorias",
        profile: "Perfil",
      },
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
        title: "Balance",
        subtitle: "Resumen financiero del mes seleccionado y su historico.",
        heading: (monthLabel: string) => `Resumen financiero - ${monthLabel}`,
        monthLabel: "Mes",
        accountLabel: "Cuenta",
        allAccountsLabel: "Todas las cuentas",
        latestMonthHint:
          "Si no eliges un mes, se muestra el ultimo mes con movimientos.",
        currentCardDescription: (currency: string, accountName?: string | null) =>
          accountName
            ? `Vista de ingresos, gastos y balance en ${currency} para ${accountName}.`
            : `Vista consolidada de ingresos, gastos y balance en ${currency}.`,
        currentCardPendingDescription:
          "Completa tu perfil financiero para ver analytics coherentes en tu moneda base.",
        categoryBreakdownTitle: "Distribucion por categoria",
        categoryBreakdownDescription:
          "Que categorias concentran mas dinero en el mes seleccionado.",
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
        historyPending:
          "Completa tu perfil financiero para ver el historico mensual.",
        noHistory: "Todavia no hay movimientos para calcular el balance.",
        selectedMonthEmpty: "No hay movimientos en el mes seleccionado.",
        selectedMonthSkippedNotice: (count: number, currency: string) =>
          `${count} transacciones quedaron fuera del balance del mes porque no se pudieron convertir de forma segura a ${currency}.`,
        historySkippedNotice: (count: number, currency: string) =>
          `Hay ${count} transacciones legacy excluidas del historico porque no existe una conversion confiable hacia ${currency}.`,
      },
      categories: {
        title: "Categorias",
        subtitle: "Organiza tus transacciones por ingresos y gastos.",
        newCardTitle: "Nueva categoria",
        newCardDescription:
          "Agrega una categoria para agrupar tus movimientos.",
        name: "Nombre",
        direction: "Direccion",
        parentOptional: "Agrupar en (opcional)",
        parentHelpTitle: "Para que sirve?",
        parentHelpDescription:
          "Si eliges un grupo, la nueva categoría creada se convierte en una subcategoría. Esto te ayuda a organizar mejor en qué gastaste tu dinero o de dónde provino, por ejemplo: Grupo: Hogar > Subcategoría: Mercado.",
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
        subtitle: "Haz seguimiento de tus ingresos y gastos.",
        newCardTitle: "Nueva transaccion",
        newCardDescription: "Registra un ingreso o un gasto.",
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
        summaryTransactions: "Movimientos",
        summaryIncome: "Ingresos",
        summaryExpense: "Gastos",
        summaryBalance: "Balance",
        summaryCategories: "Categorias activas",
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
        validations: {
          accountRequired: "La cuenta es obligatoria",
          categoryRequired: "La categoria es obligatoria",
          amountRequired: "El monto es obligatorio",
          amountInvalid: "El monto solo puede contener numeros",
          currencyRequired: "La moneda es obligatoria",
          dateRequired: "La fecha es obligatoria",
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
          "Configura la moneda fija de tu cuenta y la zona horaria usada en onboarding, balance y transacciones.",
        financeDescription:
          "Elige la moneda fija de tu cuenta y la zona horaria que usaremos para ordenar dias y meses.",
        financeSave: "Guardar perfil financiero",
        financeSaving: "Guardando perfil...",
        financeSaved: "Perfil guardado",
        baseCurrencyLabel: "Moneda base",
        baseCurrencyPlaceholder: "COP",
        baseCurrencyHint:
          "Elige la moneda principal de tu cuenta. Todas las transacciones nuevas usaran esta moneda.",
        baseCurrencyLockedHint:
          "Como ya tienes movimientos registrados, la moneda base queda fija para conservar la consistencia del historial.",
        baseCurrencyInvalid:
          "La moneda base debe ser un codigo ISO de 3 letras, por ejemplo COP o USD.",
        timezoneLabel: "Zona horaria",
        timezonePlaceholder: "America/Bogota",
        timezoneBrowserAction: "Usar la del navegador",
        timezoneHint: (browserTimeZone: string) =>
          `Puedes escribir para buscar una zona horaria o usar la detectada en este navegador: ${browserTimeZone}.`,
        timezoneExamples:
          "Ejemplos: America/Bogota, America/New_York, Europe/Madrid.",
        timezoneInvalid: "Selecciona una zona horaria IANA valida.",
        financialAccountsTitle: "Cuentas financieras",
        financialAccountsDescription:
          "Administra las cuentas donde registras movimientos. La cuenta por defecto se preselecciona en nuevas transacciones.",
        financialAccountsDefaultHint:
          "La cuenta por defecto se usa automaticamente cuando registras una nueva transaccion.",
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
        balance: "Balance",
        transactions: "Transactions",
        categories: "Categories",
        profile: "Profile",
      },
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
        title: "Balance",
        subtitle: "Financial summary for the selected month and full history.",
        heading: (monthLabel: string) => `Financial summary - ${monthLabel}`,
        monthLabel: "Month",
        accountLabel: "Account",
        allAccountsLabel: "All accounts",
        latestMonthHint:
          "Without a filter, the latest month with activity is shown.",
        currentCardDescription: (currency: string, accountName?: string | null) =>
          accountName
            ? `View of income, expenses, and balance in ${currency} for ${accountName}.`
            : `Consolidated view of income, expenses, and balance in ${currency}.`,
        currentCardPendingDescription:
          "Complete your financial profile to unlock coherent analytics in your base currency.",
        categoryBreakdownTitle: "Category breakdown",
        categoryBreakdownDescription:
          "See which categories hold the most money in the selected month.",
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
        historyPending:
          "Complete your financial profile to start seeing monthly history.",
        noHistory: "There is no activity yet to calculate the balance.",
        selectedMonthEmpty: "There is no activity in the selected month.",
        selectedMonthSkippedNotice: (count: number, currency: string) =>
          `${count} transactions were excluded from this month's balance because they could not be converted safely to ${currency}.`,
        historySkippedNotice: (count: number, currency: string) =>
          `There are ${count} legacy transactions excluded from history because no reliable conversion to ${currency} exists.`,
      },
      categories: {
        title: "Categories",
        subtitle:
          "Organize your transactions by income and expense categories.",
        newCardTitle: "New category",
        newCardDescription: "Add a category to group your transactions.",
        name: "Name",
        direction: "Direction",
        parentOptional: "Group into (optional)",
        parentHelpTitle: "What is this for?",
        parentHelpDescription:
          "If you choose a group, this category becomes a subcategory. Use it to organize where your money went or where it came from, for example: Home > Groceries.",
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
        subtitle: "Track your income and expenses.",
        newCardTitle: "New transaction",
        newCardDescription: "Record a new income or expense.",
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
        summaryTransactions: "Transactions",
        summaryIncome: "Income",
        summaryExpense: "Expenses",
        summaryBalance: "Balance",
        summaryCategories: "Active categories",
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
        validations: {
          accountRequired: "Account is required",
          categoryRequired: "Category is required",
          amountRequired: "Amount is required",
          amountInvalid: "Amount can only contain numbers",
          currencyRequired: "Currency is required",
          dateRequired: "Date is required",
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
          "Set the fixed account currency and time zone used by onboarding, balance, and transactions.",
        financeDescription:
          "Choose the fixed currency for your account and the time zone used for day and month boundaries.",
        financeSave: "Save financial profile",
        financeSaving: "Saving profile...",
        financeSaved: "Profile saved",
        baseCurrencyLabel: "Base currency",
        baseCurrencyPlaceholder: "USD",
        baseCurrencyHint:
          "Choose the main currency for your account. Every new transaction will use this currency.",
        baseCurrencyLockedHint:
          "Because you already have recorded activity, the base currency is now locked to preserve historical consistency.",
        baseCurrencyInvalid:
          "Base currency must be a 3-letter ISO code, for example USD or COP.",
        timezoneLabel: "Time zone",
        timezonePlaceholder: "America/New_York",
        timezoneBrowserAction: "Use browser time zone",
        timezoneHint: (browserTimeZone: string) =>
          `You can type to search for a time zone or reuse the one detected in this browser: ${browserTimeZone}.`,
        timezoneExamples:
          "Examples: America/Bogota, America/New_York, Europe/Madrid.",
        timezoneInvalid: "Select a valid IANA time zone.",
        financialAccountsTitle: "Financial accounts",
        financialAccountsDescription:
          "Manage the accounts where you record activity. The default account is preselected for new transactions when needed.",
        financialAccountsDefaultHint:
          "The default account is used automatically when you record a transaction without choosing another one.",
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
