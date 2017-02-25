/* @flow */

import * as E from '../misc/error-codes.js';
import * as S from '../misc/success-codes.js';

export default {
    errors: {
        [E.GENERAL_ERROR]: `FR Sorry, your request has failed`,
        [E.NOT_AUTHORIZED]: `FR Wrong email or password`,
        [E.USER_NOT_FOUND]: `FR User not found`,
        [E.SIGN_IN_GENERAL]: `FR Sorry, couldn't sign in`,
        [E.SIGN_IN_INVALID_EMAIL]: `FR Invalid email address`,
        [E.SIGN_IN_INVALID_PASSWORD]: `FR Password cannot be empty`,
        [E.EXPIRED_VERIFICATION_CODE]: `FR This verification code is expired`,
        [E.VERIFY_REGISTRATION_INVALID_EMAIL]: `FR Invalid email address`,
        [E.VERIFY_REGISTRATION_INVALID_CODE]: `FR Please enter your verification code`,
        [E.VERIFY_REGISTRATION_GENERAL]: `FR Sorry, couldn't verify registration`,

        [E.SEND_EMAIL_GENERAL]: `FR Sorry, couldn't send email`,
        [E.SEND_EMAIL_INVALId_EMAIL]: 'FR Invalid email address',
        [E.SEND_EMAIL_NO_EMAIL]: 'FR Please enter an email address',
        [E.SEND_EMAIL_NO_MESSAGE]: 'FR Please write a message',

        [E.UPDATE_ATTRS_AND_PASS_INVALID_PARAMETER]: `FR One of the fields is invalid`,
        [E.UPDATE_ATTRS_AND_PASS_GENERAL]: `FR Sorry, couldn't update your information`,

        [E.FETCH_BOTS_GENERAL]: `FR Sorry, couldn't fetch bots`,

        [E.FETCH_USERS_GENERAL]: `FR Sorry, couldn't fetch users`,

        [E.FETCH_CONVERSATIONS_GENERAL]: `FR Sorry, couldn't fetch conversations`,

        [E.FETCH_MESSAGES_GENERAL]: `FR Sorry, couldn't fetch messages`,

        [E.ADD_BOT_GENERAL]: `FR Sorry, couldn't add bot`,

        [E.UPDATE_BOT_GENERAL]: `FR Sorry, couldn't update bot settings`,

        [E.ADD_BOT_FEED_ALL_FIELDS]: `FR Please fill out all fields`,
        [E.ADD_BOT_FEED_GENERAL]: `FR Sorry, couldn't add feed`,

        [E.FORCE_SEND_FEEDS_GENERAL]: `FR Sorry, couldn't send feeds`,

        [E.SAVE_USER_GENERAL]: `FR Sorry, couldn't save user`,
        [E.SAVE_USER_INVALID_EMAIL]: `FR Invalid email address`,

        [E.FETCH_USER_GENERAL]: `FR Sorry, couldn't fetch user`,
    },
    successes: {
        [S.SEND_EMAIL]: `FR Email successfully sent, thanks.`,
        [S.UPDATE_ATTRS_AND_PASS]: 'FR Successfully updated',
        [S.ADD_BOT_GENERAL]: `FR Bot successfully created`,
        [S.FORCE_SEND_FEEDS]: `FR Feeds successfully sent`,
    },
    app: {
        pageTitle: 'Deepiks: plateforme de chatbots avancée',
    },
    header: {
    },
    accountButton: {
        signIn: 'Se connecter',
        signUp: 'S\'enregistrer',
        signOut: 'Se déconnecter',
        verifyRegistration: 'Vérifier le mail',
        account: 'Compte',
    },
    sideMenu: {
        account: 'Compte',
        admin: 'Admin',
        users: 'Utilisateurs',
        polls: 'Sondages',
        transcripts: 'Conversations',
        feeds: 'Flux',
        notifications: 'Notifications',
        features:'Fonctionalités',
         pricing:'Tarifs',
        team:'Team',
        channels:'Equipe',
        timeline:'Chronologie',
        contact:'Contact',
        test:'Test',
        surveys:'Surveys',
        tracking:'Statistiques',
        settings:"Paramètres",
  },
    home: {
    	hello: 'Bonjour.',
    	baseline: 'Nous sommes une plateforme de chatbots avancée.',
    	services_h: 'Plateforme de chatbots avancée',
        services_t : 'Notre plateforme offre un large éventail de fonctionnalités, simples à mettre en oeuvre',
    	universal_h: 'Universalité',
		universal_t : 'Déployez votre bot sur différents canaux: Messenger, Skype, Slack, Spark, Telegram et plus ...',
		notifications_h : 'Notifications',
		notifications_t : 'Envoyez des notifications automatiques ou manuelles à vos utilisateurs.',
		tracking_h : 'Statistiques',
		tracking_t : 'Mesurez l\'utilisation de votre bot, et les résultats de vos sondages.',
        ai_h : 'Intelligence artificielle',
        ai_t : 'Votre bot s\'améliore au fil du temps. Vous pouvez l\'entraîner en permanence, ou le laisser apprendre des données qu\'il collecte.',
        pricing: 'Tarif',
        price_1: 'GRATUIT',
        price_2: '',
        price_3: '',
        price_4: 'DEVIS',
        action_1:'',
        action_2:'',
        action_3:'',
        action_4:'',
        feature_1_1:'1 bot',
        feature_2_1:'1 bot',
        feature_3_1:'10 bots',
        feature_4_1:'Bots illimités',
        feature_1_2:'Pour usage perso ou test',
        feature_2_2:'Pour usage commercial',
        feature_3_2:'Pour usage commercial',
        feature_4_2:'Pour usage commercial',
        feature_1_3:'Pas de notifications',
        feature_2_3:'10,000 notifications/mois',
        feature_3_3:'100,000 notifications/mois',
        feature_4_3:'Notifications illimitées',
        feature_1_4:'Statistiques Dashbot',
        feature_2_4:'Statistiques Dashbot',
        feature_3_4:'Statistiques Dashbot',
        feature_4_4:'Statistiques spécifiques',
        feature_1_5:'Sondages illimités',
        feature_2_5:'Sondages illimités',
        feature_3_5:'Sondages illimités',
        feature_4_5:'Sondages illimités',
        feature_1_6:'Moteur conversationnel Wit.ai',
        feature_2_6:'Moteur conversationnel Wit.ai',
        feature_3_6:'Moteur conversationnel Wit.ai',
        feature_4_6:'Moteur conversationnel au choix',
        feature_1_7:'AI standard',
        feature_2_7:'AI standard',
        feature_3_7:'AI standard',
        feature_4_7:'AI spécifique',
        team_h: 'Nos fondateurs',
        team_t: 'Deepiks a été fondé par deux entrepreneurs, très expérimentés dans le secteur des industries créatives',
        screenshots_h: 'Exemple',
        screenshots_t: 'Voici un exemple de bot déployé sur différents canaux',
        timeline_h: 'Chronologie',
        timeline_t: '',
        timeline_5_d:'Octobre 2016',
        timeline_5_h:'Lancement',
        timeline_5_t:'Deepiks lance sa platforme de bots',
        timeline_4_d:'Juin 2016',
        timeline_4_h:'Pivot',
        timeline_4_t:'Deepiks pivote sur un modèle de plateforme de bots, en gardant un focus important sur le deep learning ',
        timeline_3_d:'Avril 2016',
        timeline_3_h:'X-UP !',
        timeline_3_t:'Deepiks rejoint X-UP, l\'accélérateur de l\'école Polytechnique.',
        timeline_2_d:'February 2016',
        timeline_2_h:'Création',
        timeline_2_t:'Deepiks est fondé, et commence à développer des solutions de Deep Learning pour les industries créatives',
        timeline_1_d:'',
        timeline_1_h:'',
        timeline_1_t:'',
        contact_h:'Nous contacter',
        contact_t:'Si vous souhaitez nous contacter, merci d\'envoyer un mail à info@deepiks.io, ou d\'utiliser le formulaire suivant',
    },
    homeContactForm: {
        name: 'Nom',
        namePlaceholde: 'Vote nom',
        email: 'E-mail',
        emailPlaceholder: 'Votre adresse mail',
        subject: 'Objet',
        selectSubject: 'Sélectionnez l\'objet',
        generalCustomerService: 'Demande d\'information',
        suggestions: 'Demande de devis',
        other: 'Autre',
        message: 'Message',
        messagePlaceholder: 'Texte de votre message',
        send: 'Envoyer message',
    },
    signedInPage: {
        pleaseSignIn: 'Veuillez vous connecter',
        fetchingBots: 'Recherche de bots en cours...',
        newBot: 'Créer un nouveau bot',
    },
    accountPage: {
        title: 'Compte',
        fetching: 'Recherche de bots en cours, veuillez patienter...',
        profile: 'Profil',
        bots: 'Vos Bots',
        addBot: 'Ajouter un bot',
        name: 'Nom',
        type: 'Type',
        webhookUrls: 'Webhook URLs',
        givenName: 'Prénom',
        familyName: 'Nom',
        phoneNumber: 'Téléphone',
        oldPassword: 'Ancien mot de passe',
        newPassword: 'Nouveau mot de passe',
        save: 'Enregistrer',
        show: 'Montrer',
        ok: 'OK',
    },
    notificationsPage: {
        fetching: 'Recherche de bots en cours, veuillez patienter...',
        notifications: 'Notifications',
    },
    usersPage: {

    },
    messagesPage: {

    },
    feedsPage: {
        feeds: 'Flux',
        feedName: 'Nom du flux',
        source: 'Source',
        categories: 'FR Categories',
        scheduledEveryDayAt: 'Diffusé chaque jour à',
        newFeed: 'Créer un nouveau flux',
        newBot: 'Créer un nouveau bot',
        fetchingFeeds: 'Recherche de flux en cours...',
        noBots: 'Vous n\'avez aucun bot',
        noFeeds: 'Vous n\'avez encore aucun flux',
        sendNow: 'FR Send now',
    },
    newFeed: {
        create: 'Créer',
        newFeedTitle: 'Nouveau flux',
        feedName: 'Nom du flux',
        feedNamePlaceholder: 'Entrer le nom du flux',
        categories: 'Categories',
        categoriesPlaceholder: 'Entrez les catégories, séparées par une virgule',
        source: 'Source',
        publishHourLabel: 'Diffusé chaque jour à ',
        twitterScreenName: '@screenName',
        rssUrl: 'https://example.com/rss-feed',
        requiredField: 'Champs obligatoire',
    },
    addBot: {
        title: 'Ajouter bot',
        botName: 'Nom',
        addBot: 'Ajouter bot',
        cancel: 'Annuler',
        ciscosparkAccessToken: 'Cisco Spark access token',
        messengerPageAccessToken: 'Facebook page access token',
        messengerAppSecret: 'Facebook app secret',
        microsoftAppId: 'Microsoft app ID',
        microsoftAppPassword: 'Microsoft app password',
        witAccessToken: 'Wit access token',
        twitterConsumerKey: 'Twitter consumer key',
        twitterConsumerSecret: 'Twitter consumer secret',
        dashbotFacebookKey: 'Dashbot Facebook key',
        dashbotGenericKey: 'Dashbot generic key',
    },
    signUp: {
        title: 'S\'enregistrer',
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'E-mail',
        password: 'Mot de passe',
        signUp: 'S\'enregistrer',
    },
    verifyRegistration: {
        title: 'Vérifier le mail',
        verify: 'Vérifier',
        email: 'E-mail',
        code: 'Code de vérification',
    },
    signIn: {
        title: 'Se connecter',
        email: 'E-mail',
        password: 'Mot de passe',
        signIn: 'Se connecter',
    },
    contacts: {
        title: 'Nous contacter',
        send: 'Envoyer',
        name: 'Nom',
        email: 'E-mail',
        subject: 'Objet',
        message: 'Votre message...',
    },
    privacyPage: {
        privacy: 'Confidentialité',
    },
    termsOfUsePage: {
        termsOfUse: 'Conditions d\'utilisation',
    },
    cookieConsent: {
        message: 'Ce site utilise des cookies pour une meilleure expérience.',
        more: 'Plus d\'infos.',
        dismiss: 'J\'ai compris!',
    },
};