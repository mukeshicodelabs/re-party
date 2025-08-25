pipeline {
  agent any
  stages {
    stage("verify tooling") {
      steps {
        sh '''
          docker version
          docker info
          docker compose version
          curl --version
        '''
      }
    }
    stage('Prune Docker data') {
      steps {
         sh 'docker compose down --remove-orphans -v'
        sh 'docker system prune -a --volumes -f'
      }
    }
    stage('Start container') {
      steps {
        sh 'sudo COMPOSE_HTTP_TIMEOUT=200 ENVFILE=./staging.env docker compose up --build -d --wait'
        sh 'sudo docker compose ps'
      }
    }
    stage('Run tests against the container') {
      steps {
        sh 'curl https://reparty.icodestaging.in'
      }
    }
    stage('run log file') {
      steps {
        sh 'sudo rm -f /var/www/weblogs/reparty.log'
        sh 'sudo touch /var/www/weblogs/reparty.log'
        sh 'sudo chmod 777 /var/www/weblogs/reparty.log'
        sh 'sudo docker logs -f reparty > /var/www/weblogs/reparty.log 2>&1 &'
      }
    }
  }
  post {
    failure {
      sh 'docker compose down --remove-orphans -v'
      sh 'docker compose ps'
    }
  }
}
