Feature: Journalisation des erreurs HTTP internes
  Afin de diagnostiquer les indisponibilités du service
  En tant qu'équipe de maintenance
  Je veux que les réponses HTTP 500 ou supérieures soient consignées dans les logs serveur

  Scenario: Exception non gérée par une route
    Given une route lève une erreur inattendue
    When un client appelle cette route
    Then le client reçoit une réponse HTTP 500
    And les logs contiennent l'identifiant de requête, la méthode, le chemin et l'erreur

  Scenario: Réponse 500 construite par une route
    Given une route construit une réponse HTTP 500
    When un client appelle cette route
    Then les logs contiennent l'identifiant de requête, la méthode, le chemin et le statut 500
