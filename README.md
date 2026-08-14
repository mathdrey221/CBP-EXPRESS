# CBP Express Hub

Tu es un développeur Fullstack Senior. Crée-moi une application Web complète nommée "CBP EXPRESS DASHBOARD".

CONTEXTE ENTREPRISE:

CBP Express = Société de livraison de colis au Bénin. Réseau: Cotonou, Bohicon, Parakou. ça va évolué vers d'autres horizons mais pour le moment, ce sont seulement ces trois points. 

Objectif: Gérer les dépôts, transports, retraits et notifier les clients auto.

UTILISATEURS ET RÔLES:

1. Admin: Voir tout, gérer agents, voir CA, configurer IA

2. Agent Point Relais: Ne voit que son point. Créer colis, Scanner QR, Changer statut

3. Comptable: Voir les paiements et faire les reversements

MODULE 1: GESTION DES COLIS

- Créer bon d'envoi numérique. Champs: N° Suivi auto format CBP-AAAAMMJJ-XXX, Expéditeur Nom/prénom/Tel/Ville, Destinataire Nom/prénom/Tel/Ville, Contenu, Poids, Montant à payer, Ville Dépôt, Ville Retrait, Point Relais Retrait

- Statuts: Déposé, En Transit, Arrivé au point relais, Notifié Client, Retiré, Retour Expéditeur

- Scanner Code QR / Code barre pour changer statut en 1 clic

- Upload photo du colis à la prise en charge

MODULE 2: TABLEAU DE BORD ADMIN

- KPI temps réel: Colis du jour, CA du jour, Colis en retard +3j, Taux de retrait

- Carte du Bénin avec les 3 villes et nb de colis par ville

- Filtres par Agent, par Ville, par Date

MODULE 3: NOTIFICATIONS AUTO WHATSAPP ET SMS

À chaque changement de statut, envoyer auto via API. Utiliser les 4 textes fournis.

API WhatsApp: WhatsApp Cloud API. API SMS: Hubtel ou Twilio.

MODULE 4: WHATSAPP BUSINESS + IA ASSISTANT

- Connecter le CRM à l'API WhatsApp Business

- Intégrer une IA GPT-4o qui lit les messages clients

- L'IA a accès en lecture aux tables Colis et Points Relais

- L'IA doit répondre seule à: Suivi de colis, Demande de tarifs, Horaires, FAQ

- Si l'IA ne comprend pas, créer un ticket et notifier l'Admin

- Interface pour que l'Admin puisse reprendre la conversation manuellement

MODULE 5: PORTAIL CLIENT PUBLIC

Page 1 "Suivre mon colis": Champ pour entrer N° CBP-XXX. Affiche statut + carte du point relais

Page 2 "Créer un envoi": Formulaire. À la soumission, crée un colis statut "En attente de dépôt" dans le CRM et envoie N° par WhatsApp

MODULE 6: COMPTA ET RAPPORTS

- Suivi paiement Espèces et Mobile Money

- Rapport de caisse par Agent par jour

- Export Excel des colis et du CA

TECHNIQUE:

Stack: React + Tailwind + Node.js + Express + MongoDB + JWT

Responsive Mobile First. Design: Bleu #0057B8, Orange #FF6B00, Blanc. Logo CBP Express.

Générer QR Code sur chaque bon. Déployer sur VPS.

1. LES 6 MESSAGES AUTO À METTRE DANS LE CRM

Variables entre [ ] = le CRM remplit auto

MESSAGE 1: DÉPÔT CONFIRMÉ 

Déclencheur: Statut "Déposé"

CBP EXPRESS ✅ Dépôt Confirmé

Bonjour [Nom Expéditeur],

Votre colis a bien été pris en charge.

N° Suivi: [CBP-AAAAMMJJ-XXX]

Pour: [Nom Destinataire] à [Ville Retrait]

Montant à récupérer: [XXXX] FCFA

Suivez-le ici: cbpexpress.bj/suivi/[CBP-AAAAMMJJ-XXX]

Merci pour votre confiance.

CBP Express - 24h Chrono

MESSAGE 2: ARRIVÉE AU POINT RELAIS

Déclencheur: Statut "Arrivé au point relais"

CBP EXPRESS 📍 Colis Arrivé

Bonjour [Nom Destinataire],

Votre colis N°[CBP-AAAAMMJJ-XXX] est arrivé.

Point de retrait: [Nom Point Relais]

Adresse: [Adresse complète]

Horaires: Lun-Sam 8h-18h

À payer: [XXXX] FCFA

Pièce: Carte d'identité obligatoire

Conservation: 3 jours gratuits.

CBP Express

MESSAGE 3: RELANCE J+2

Déclencheur: 48h après "Arrivé" et pas "Retiré"

CBP EXPRESS ⏰ Rappel Important

Bonjour [Nom Destinataire],

Votre colis N°[CBP-AAAAMMJJ-XXX] vous attend toujours à [Ville Retrait].

⚠️ Il reste 1 jour avant retour à l'expéditeur.

Adresse: [Adresse complète]

Passez le récupérer aujourd'hui.

CBP Express

MESSAGE 4: RETRAIT EFFECTUÉ

Déclencheur: Statut "Retiré"

CBP EXPRESS ✅ Livraison Réussie

Bonjour [Nom Expéditeur],

Votre colis N°[CBP-AAAAMMJJ-XXX] a été RETIRÉ.

Par: [Nom Destinataire]

Le: [Date Heure]

Montant récupéré: [XXXX] FCFA

Reversement prévu sous 24h.

Merci CBP Express

MESSAGE 5: PAIEMENT REVERSÉ À L’E-COMMERCANT

Déclencheur: Quand tu coches "Reversé" dans le CRM

CBP EXPRESS 💰 Reversement Effectué

Bonjour [Nom E-commerçant],

Nous venons de vous reverser [XXXX] FCFA sur [MTN MoMo / Moov Money].

Période: Du [Date Début] au [Date Fin]

Nb de colis payés: [XX]

Détails: cbpexpress.bj/comptes

Merci pour votre confiance.

CBP Express

MESSAGE 6: RETOUR À L'EXPÉDITEUR

Déclencheur: Statut "Retour Expéditeur"

CBP EXPRESS ↩️ Retour Colis

Bonjour [Nom Expéditeur],

Le colis N°[CBP-AAAAMMJJ-XXX] n'a pas été récupéré.

Il est de retour à [Ville Dépôt] au point [Nom Point Relais].

Frais de retour: [XXX] FCFA

Contactez-nous pour re-programmer la livraison.

CBP Express

---

2. PROMPT POUR CONNECTER WHATSAPP BUSINESS + IA + CRM

Donne ça à ton dev. C’est le "cerveau" du bot :

TU ES UN DÉVELOPPEUR BACKEND. INTÈGRE UN MODULE "WHATSAPP IA" AU CRM CBP EXPRESS.

OBJECTIF: Répondre auto à 80% des clients sur WhatsApp en allant chercher les infos dans le CRM.

STACK TECHNIQUE:

1. API: WhatsApp Cloud API de Meta

2. IA: OpenAI GPT-4o-mini ou Claude 3.5 Haiku

3. Webhook: Node.js + Express pour recevoir les messages

FONCTIONNEMENT DÉTAILLÉ:

ETAPE 1: RÉCEPTION

Quand un client envoie un message au numéro WhatsApp Business de CBP, le webhook le reçoit et l’envoie à l’IA.

ETAPE 2: L'IA ANALYSE L'INTENTION

Donne ce "System Prompt" à l'IA:

Tu es "Assistant CBP Express", un agent IA pour une société de livraison au Bénin. Ton rôle est d'aider les clients par WhatsApp.

Règles: Réponds en Français. Ton pro et rapide. Utilise des emoji. Signe par "- Assistant CBP"

Tu as accès à 2 outils: 

1. get_tracking_info(numero_suivi): Cherche le colis dans le CRM et retourne statut, adresse, montant

2. get_tarifs(ville_depart, ville_arrivee): Retourne le prix

Intention possibles:

- SUIVI: Si message contient "suivi", "où est", "CBP-"

- TARIF: Si message contient "prix", "combien", "tarif"

- HORAIRE: Si message contient "heure", "ouvert"

- HUMAIN: Si message contient "problème", "plainte", "agent"

- AUTRE: Réponds avec FAQ

ETAPE 3: ACTION

Si intention = SUIVI: Appelle get_tracking_info avec le N° trouvé. Formule la réponse avec les infos.

Si intention = TARIF: Réponds: "Cotonou-Cotonou: 1000F | Cotonou-Bohicon: 1500F | Cotonou-Parakou: 2000F. Délai 24h - Assistant CBP"

Si intention = HUMAIN: Réponds "Je comprends. Un agent CBP vous répond sous 10min" et crée un ticket dans le CRM pour l'Admin.

ETAPE 4: ENVOI

Renvoie la réponse de l'IA via l'API WhatsApp.

TABLEAU DE BORD ADMIN:

Dans le CRM, ajoute une page "Boîte de réception WhatsApp" pour voir toutes les conv et reprendre la main.

SÉCURITÉ: Vérifier le token du webhook Meta.

Ou bien 

Le client écrit une fois et il a tout sans taper.

1. MESSAGE DE BIENVENUE AUTO

Déclencheur : Quand quelqu’un écrit pour la 1ère fois au WhatsApp CBP

Bienvenue chez CBP EXPRESS 📦

Bonjour ! Je suis l'assistant virtuel de CBP Express.

Votre réseau de livraison Cotonou - Bohicon - Parakou.

Je peux vous aider 24h/24.

Choisissez une option ci-dessous 👇

2. LE MENU À BOUTONS WHATSAPP

C’est 3 boutons qui s’affichent direct sous le message

Bouton 1	Bouton 2	Bouton 3

*1. Suivre un colis*	*2. Nos Tarifs*	*3. Parler à un agent*

SI LE CLIENT CLIQUE "1. Suivre un colis"

Le bot répond :

Parfait ! Envoyez-moi juste le N° de suivi. 

Exemple: CBP-060824-001

Je vous donne la position en 2 secondes 👇

→ Après il tape le N°, l’IA va chercher dans le CRM et répond avec le Message 2 "Arrivé" ou le statut actuel.

SI LE CLIENT CLIQUE "2. Nos Tarifs"

Le bot répond :

Nos Tarifs CBP Express - Délai 24h

Cotonou - Cotonou: 1000 FCFA

Cotonou - Bohicon: 1500 FCFA  

Cotonou - Parakou: 2000 FCFA

Options:

Paiement à la livraison: +2%

Assurance: +500 FCFA

Vous voulez faire un envoi ? Tapez ENVOI 

- Assistant CBP

SI LE CLIENT CLIQUE "3. Parler à un agent"

Le bot répond :

Je comprends 👍

Un agent CBP va vous répondre dans moins de 10 minutes.

En attendant, décrivez-moi votre problème ici.

Heures ouvrables: Lun-Sam 8h-18h

- Assistant CBP

→ Et le CRM crée un ticket "URGENT" pour toi.

3. PROMPT À AJOUTER POUR L'IA DANS LE CRM

Colle ça dans la partie "System Prompt" de ton IA :

Tu es l'assistant WhatsApp de CBP Express. 

Règles:

1. Réponds toujours en Français, court, avec 1 emoji max.

2. Si le client envoie un N° qui commence par CBP-, utilise la fonction get_tracking_info() pour aller chercher dans le CRM.

3. Si le client dit "Bonjour" ou "Menu", renvoie le message de bienvenue + les 3 boutons.

4. Si tu ne comprends pas après 2 essais, dis: "Je vous passe un agent" et notifie l'Admin.

5. Termine toujours par "- Assistant CBP"

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cbp-express-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/29e9e35b-e90b-4221-8c6c-39fb925d9310).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
