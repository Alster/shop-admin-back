#!/usr/bin/env bash

MONGO_SINGLE_REPLICA="mongodb_local_single_replica"

CLEAN="clean"
RUN="run"
STOP="stop"
DAEMON="daemon"

if [ "$#" -eq 0 ] || [ $1 = "-h" ] || [ $1 = "--help" ]; then
    echo "Usage: ./start_test [OPTIONS] COMMAND [arg...]"
    echo "       ./start_test [ -h | --help ]"
    echo ""
    echo "Options:"
    echo "  -h, --help    Prints usage."
    echo ""
    echo "Commands:"
    echo "  $CLEAN      - Stop and Remove containers."
    echo "  $RUN        - Build and Run containers."
    echo "  $DAEMON     - Build and Run containers in background."
    echo "  $STOP       - Stop containers."
    exit
fi

clean() {
  echo "Cleaning..."
  stop_existing
  remove_stopped_containers
  remove_unused_volumes
}

init_mongo_replica_set() {
  master_node="$1"
  port="$2"

  str="rs.initiate({_id : \"rs0\", version: 1, members: [{ _id : 1, host : \"localhost:$port\" }]})"
  echo $str

  docker exec -i $master_node mongo --port $port --quiet --eval "$str"
}

is_mongo_healthy() {
    health_status="$(docker exec -i $1 mongo --port $2 --quiet --eval "db.runCommand( { serverStatus: 1 } ).ok")"
    if [ "$health_status" = "1" ]; then
        return 0
    else
        return 1
    fi
}

run_mongo() {
  while ! is_mongo_healthy $1 $2; do sleep 1; done
  echo "Mongo with ID $1:$2 live"
  init_mongo_replica_set $1 $2
}

run() {
  clean

  echo "Running docker..."
  docker compose -f docker-compose.local.yaml up --build -d
  run_mongo $MONGO_SINGLE_REPLICA 27037
}

run_daemon() {
  echo "Cleaning..."
  clean

  echo "Running docker..."
  docker compose -f docker-compose.local.yaml up --build --detach
  echo "Started as daemon"
}

stop_existing() {
  docker compose -f docker-compose.local.yaml down --remove-orphans
}

remove_stopped_containers() {
  CONTAINERS="$(docker ps -a -f status=exited -q)"
	if [ ${#CONTAINERS} -gt 0 ]; then
		echo "Removing all stopped containers."
		docker rm $CONTAINERS
	else
		echo "There are no stopped containers to be removed."
	fi
}

remove_unused_volumes() {
  CONTAINERS="$(docker volume ls -qf dangling=true)"
	if [ ${#CONTAINERS} -gt 0 ]; then
		echo "Removing all unused volumes."
		docker volume rm $CONTAINERS
	else
		echo "There are no unused volumes to be removed."
	fi
}

if [ $1 = $CLEAN ]; then
  echo "Cleaning..."
	clean
	exit
fi

if [ $1 = $RUN ]; then
	run
	exit
fi

if [ $1 = $DAEMON ]; then
	run_daemon
	exit
fi

if [ $1 = $STOP ]; then
	stop_existing
	exit
fi
