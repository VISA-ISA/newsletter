Feature: Persistance conforme au schéma de la newsletter

  Scenario: Enregistrer le suivi d’un email envoyé
    Given un email de newsletter est envoyé à un abonné
    When son envoi est enregistré
    Then les champs created_at et updated_at de la table emails sont renseignés

  Scenario: Mettre à jour le statut de livraison d’un email
    Given un email de newsletter déjà enregistré
    When Brevo signale sa livraison
    Then son statut et le champ updated_at sont mis à jour

  Scenario: Créer un abonné trouvé absent
    Given une adresse email sans abonné correspondant
    When elle est enregistrée comme abonné
    Then les champs createdAt et updatedAt de la table subscribers sont renseignés
